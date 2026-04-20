import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { ensureDefaultWorkspaceForUser } from '../lib/userBootstrap.js'

type AuthedRequest = FastifyRequest & { user: { id: string; email: string; name: string } }

type MemberRole = 'admin' | 'member' | 'observer'

type WorkspaceMembership = { workspaceId: string; role: MemberRole }

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : ''
}

function toIsoOrNull(d: Date | null | undefined) {
  return d ? d.toISOString() : null
}

function dueAtToDueDate(dueAt: Date | null) {
  if (!dueAt) return ''
  return dueAt.toISOString().slice(0, 10)
}

function dueDateToDueAt(dueDate: string) {
  const s = String(dueDate || '').trim()
  if (!s) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null

  // Store as UTC midnight to keep it stable across timezones.
  return new Date(`${s}T00:00:00.000Z`)
}

async function requireWorkspaceMembership(userId: string, workspaceId: string): Promise<WorkspaceMembership> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId
      }
    },
    select: {
      workspaceId: true,
      role: true
    }
  })

  if (!membership) {
    throw Object.assign(new Error('FORBIDDEN'), { statusCode: 403 })
  }

  return membership as WorkspaceMembership
}

async function requireBoardAccess(userId: string, boardId: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      id: true,
      workspaceId: true
    }
  })

  if (!board) {
    throw Object.assign(new Error('NOT_FOUND'), { statusCode: 404 })
  }

  await requireWorkspaceMembership(userId, board.workspaceId)
  return board
}

async function requireListAccess(userId: string, listId: string) {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: {
      id: true,
      boardId: true,
      board: {
        select: {
          workspaceId: true
        }
      }
    }
  })

  if (!list) {
    throw Object.assign(new Error('NOT_FOUND'), { statusCode: 404 })
  }

  await requireWorkspaceMembership(userId, list.board.workspaceId)
  return list
}

async function requireCardAccess(userId: string, cardId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      id: true,
      boardId: true,
      listId: true,
      board: {
        select: {
          workspaceId: true
        }
      }
    }
  })

  if (!card) {
    throw Object.assign(new Error('NOT_FOUND'), { statusCode: 404 })
  }

  await requireWorkspaceMembership(userId, card.board.workspaceId)
  return card
}

function serializeAttachment(a: any) {
  return {
    id: a.id,
    name: a.fileName,
    url: a.url,
    type: a.mimeType || '',
    size: typeof a.sizeBytes === 'number' ? a.sizeBytes : 0,
    createdAt: toIso(a.createdAt)
  }
}

function serializeCard(c: any) {
  return {
    id: c.id,
    title: c.title,
    description: c.description || '',
    archived: Boolean(c.archivedAt),
    archivedAt: toIso(c.archivedAt),
    dueDate: dueAtToDueDate(c.dueAt || null),
    labelIds: [],
    assignees: [],
    checklist: [],
    comments: [],
    activity: [],
    automationMeta: { dueReminderHistory: [], ruleHistory: [] },
    attachments: Array.isArray(c.attachments) ? c.attachments.map(serializeAttachment) : [],
    createdAt: toIso(c.createdAt),
    updatedAt: toIso(c.updatedAt)
  }
}

function serializeList(l: any) {
  return {
    id: l.id,
    title: l.title,
    archived: Boolean(l.archivedAt),
    cards: Array.isArray(l.cards) ? l.cards.filter((c: any) => !c.archivedAt).map(serializeCard) : []
  }
}

function serializeBoardDetail(b: any) {
  const activeLists = Array.isArray(b.lists) ? b.lists.filter((l: any) => !l.archivedAt) : []
  const archivedLists = Array.isArray(b.lists) ? b.lists.filter((l: any) => Boolean(l.archivedAt)) : []

  const archivedCards: any[] = []
  ;(b.lists || []).forEach((l: any) => {
    ;(l.cards || []).forEach((c: any) => {
      if (!c.archivedAt) return
      archivedCards.push({
        id: c.id,
        card: serializeCard(c),
        fromListId: l.id,
        fromListTitle: l.title,
        archivedAt: toIso(c.archivedAt)
      })
    })
  })

  archivedCards.sort((a, b) => {
    const at = new Date(a.archivedAt).getTime()
    const bt = new Date(b.archivedAt).getTime()
    return bt - at
  })

  return {
    id: b.id,
    title: b.title,
    description: b.description || '',
    background: b.background || null,
    visibility: b.visibility,
    ownerEmail: '',
    workspaceKey: b.workspaceId,
    members: [],
    labels: [],
    automation: {},
    integrations: {},
    lists: activeLists
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
      .map((l: any) => ({
        ...serializeList(l),
        cards: (l.cards || [])
          .filter((c: any) => !c.archivedAt)
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          .map(serializeCard)
      })),
    archivedLists: archivedLists
      .sort((a: any, b: any) => {
        const at = (a.archivedAt ? a.archivedAt.getTime() : 0)
        const bt = (b.archivedAt ? b.archivedAt.getTime() : 0)
        return bt - at
      })
      .map((l: any) => ({
        ...serializeList(l),
        cards: (l.cards || [])
          .filter((c: any) => !c.archivedAt)
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          .map(serializeCard)
      })),
    archivedCards,
    activity: [],
    createdAt: toIso(b.createdAt),
    updatedAt: toIso(b.updatedAt)
  }
}

const boardVisibilitySchema = z.enum(['workspace', 'private', 'public'])

const createBoardSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional().default(''),
  visibility: boardVisibilitySchema.optional().default('workspace'),
  background: z.any().optional(),
  lists: z
    .array(
      z.object({
        id: z.string().min(1).max(80).optional(),
        title: z.string().min(1).max(120),
        position: z.coerce.number().int().min(0).max(10000).optional(),
        cards: z
          .array(
            z.object({
              id: z.string().min(1).max(80).optional(),
              title: z.string().min(1).max(120),
              description: z.string().max(5000).optional().default(''),
              position: z.coerce.number().int().min(0).max(100000).optional(),
              dueDate: z.string().optional().default('')
            })
          )
          .optional()
      })
    )
    .optional()
})

const updateBoardSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  visibility: boardVisibilitySchema.optional(),
  background: z.any().optional()
})

const createListSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  title: z.string().min(1).max(120),
  position: z.coerce.number().int().min(0).max(10000).optional(),
  cards: z
    .array(
      z.object({
        id: z.string().min(1).max(80).optional(),
        title: z.string().min(1).max(120),
        description: z.string().max(5000).optional().default(''),
        position: z.coerce.number().int().min(0).max(100000).optional(),
        dueDate: z.string().optional().default('')
      })
    )
    .optional()
})

const updateListSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  archived: z.boolean().optional()
})

const createCardSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  title: z.string().min(1).max(120),
  description: z.string().max(5000).optional().default(''),
  position: z.coerce.number().int().min(0).max(100000).optional(),
  dueDate: z.string().optional().default('')
})

const updateCardSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(5000).optional(),
  dueDate: z.string().optional(),
  archived: z.boolean().optional(),
  listId: z.string().min(1).max(80).optional(),
  position: z.coerce.number().int().min(0).max(100000).optional()
})

const reorderSchema = z.object({
  lists: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        position: z.coerce.number().int().min(0).max(10000)
      })
    )
    .optional(),
  cards: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        listId: z.string().min(1).max(80),
        position: z.coerce.number().int().min(0).max(100000)
      })
    )
    .optional()
})

const createAttachmentSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  name: z.string().min(1).max(255),
  url: z.string().min(1).max(100000),
  type: z.string().max(255).optional().default(''),
  size: z.coerce.number().int().min(0).max(1000000000).optional().default(0)
})

export async function boardRoutes(app: FastifyInstance) {
  app.get('/workspaces/:workspaceId/boards', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    const workspaceId = String((req.params as any).workspaceId || '').trim()

    await ensureDefaultWorkspaceForUser(r.user.id)
    await requireWorkspaceMembership(r.user.id, workspaceId)

    const boards = await prisma.board.findMany({
      where: { workspaceId },
      include: {
        lists: {
          include: {
            cards: {
              include: {
                attachments: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return {
      items: boards.map(serializeBoardDetail)
    }
  })

  app.post('/workspaces/:workspaceId/boards', { preHandler: app.auth }, async (req, reply) => {
    const r = req as AuthedRequest
    const workspaceId = String((req.params as any).workspaceId || '').trim()
    const body = createBoardSchema.parse(req.body)

    await ensureDefaultWorkspaceForUser(r.user.id)
    await requireWorkspaceMembership(r.user.id, workspaceId)

    const board = await prisma.$transaction(async (tx) => {
      const createdBoard = await tx.board.create({
        data: {
          id: body.id,
          workspaceId,
          title: body.title.trim(),
          description: body.description?.trim() || null,
          visibility: body.visibility,
          background: body.background ?? undefined
        }
      })

      if (body.lists?.length) {
        const createdLists = await Promise.all(
          body.lists.map((l, idx) => {
            const position = typeof l.position === 'number' ? l.position : idx
            return tx.list.create({
              data: {
                id: l.id,
                boardId: createdBoard.id,
                title: l.title.trim(),
                position
              }
            })
          })
        )

        // Create cards after lists (cards require boardId).
        await Promise.all(
          body.lists.map((l, idx) => {
            const listId = createdLists[idx]?.id
            if (!listId) return Promise.resolve()
            const cards = Array.isArray(l.cards) ? l.cards : []
            if (!cards.length) return Promise.resolve()

            return Promise.all(
              cards.map((c, cIdx) => {
                const position = typeof c.position === 'number' ? c.position : cIdx
                return tx.card.create({
                  data: {
                    id: c.id,
                    boardId: createdBoard.id,
                    listId,
                    title: c.title.trim(),
                    description: c.description?.trim() || null,
                    position,
                    dueAt: dueDateToDueAt(c.dueDate) ?? undefined
                  }
                })
              })
            )
          })
        )
      }

      return await tx.board.findUniqueOrThrow({
        where: { id: createdBoard.id },
        include: {
          lists: {
            include: {
              cards: {
                include: {
                  attachments: true
                }
              }
            }
          }
        }
      })
    })

    return reply.code(201).send(serializeBoardDetail(board))
  })

  app.get('/boards/:boardId', { preHandler: app.auth }, async (req, reply) => {
    const r = req as AuthedRequest
    const boardId = String((req.params as any).boardId || '').trim()

    await requireBoardAccess(r.user.id, boardId)

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        lists: {
          include: {
            cards: {
              include: {
                attachments: true
              }
            }
          }
        }
      }
    })

    if (!board) {
      return reply.code(404).send({ error: 'NOT_FOUND' })
    }

    return serializeBoardDetail(board)
  })

  app.patch('/boards/:boardId', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    const boardId = String((req.params as any).boardId || '').trim()
    const body = updateBoardSchema.parse(req.body)

    await requireBoardAccess(r.user.id, boardId)

    const updated = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...(typeof body.title === 'string' ? { title: body.title.trim() } : {}),
        ...(typeof body.description === 'string' ? { description: body.description.trim() || null } : {}),
        ...(typeof body.visibility === 'string' ? { visibility: body.visibility } : {}),
        ...(body.background !== undefined ? { background: body.background ?? undefined } : {})
      },
      include: {
        lists: {
          include: {
            cards: {
              include: {
                attachments: true
              }
            }
          }
        }
      }
    })

    return serializeBoardDetail(updated)
  })

  app.delete('/boards/:boardId', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    const boardId = String((req.params as any).boardId || '').trim()

    await requireBoardAccess(r.user.id, boardId)
    await prisma.board.delete({ where: { id: boardId } })

    return { ok: true }
  })

  app.post('/boards/:boardId/lists', { preHandler: app.auth }, async (req, reply) => {
    const r = req as AuthedRequest
    const boardId = String((req.params as any).boardId || '').trim()
    const body = createListSchema.parse(req.body)

    await requireBoardAccess(r.user.id, boardId)

    const created = await prisma.$transaction(async (tx) => {
      const list = await tx.list.create({
        data: {
          id: body.id,
          boardId,
          title: body.title.trim(),
          position: typeof body.position === 'number' ? body.position : 0
        }
      })

      if (body.cards?.length) {
        await Promise.all(
          body.cards.map((c, idx) => {
            const position = typeof c.position === 'number' ? c.position : idx
            return tx.card.create({
              data: {
                id: c.id,
                boardId,
                listId: list.id,
                title: c.title.trim(),
                description: c.description?.trim() || null,
                position,
                dueAt: dueDateToDueAt(c.dueDate) ?? undefined
              }
            })
          })
        )
      }

      return await tx.list.findUniqueOrThrow({
        where: { id: list.id },
        include: {
          cards: {
            include: { attachments: true }
          }
        }
      })
    })

    return reply.code(201).send(serializeList(created))
  })

  app.patch('/lists/:listId', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    const listId = String((req.params as any).listId || '').trim()
    const body = updateListSchema.parse(req.body)

    const list = await requireListAccess(r.user.id, listId)

    const updated = await prisma.list.update({
      where: { id: listId },
      data: {
        ...(typeof body.title === 'string' ? { title: body.title.trim() } : {}),
        ...(typeof body.archived === 'boolean'
          ? { archivedAt: body.archived ? new Date() : null }
          : {})
      },
      include: {
        cards: {
          include: { attachments: true }
        }
      }
    })

    // if list was moved across board (should never happen here), keep boardId stable
    void list

    return serializeList(updated)
  })

  app.delete('/lists/:listId', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    const listId = String((req.params as any).listId || '').trim()

    await requireListAccess(r.user.id, listId)
    await prisma.list.delete({ where: { id: listId } })

    return { ok: true }
  })

  app.post('/lists/:listId/cards', { preHandler: app.auth }, async (req, reply) => {
    const r = req as AuthedRequest
    const listId = String((req.params as any).listId || '').trim()
    const body = createCardSchema.parse(req.body)

    const list = await requireListAccess(r.user.id, listId)

    const created = await prisma.card.create({
      data: {
        id: body.id,
        boardId: list.boardId,
        listId,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        position: typeof body.position === 'number' ? body.position : 0,
        dueAt: dueDateToDueAt(body.dueDate) ?? undefined
      },
      include: {
        attachments: true
      }
    })

    return reply.code(201).send(serializeCard(created))
  })

  app.patch('/cards/:cardId', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    const cardId = String((req.params as any).cardId || '').trim()
    const body = updateCardSchema.parse(req.body)

    const card = await requireCardAccess(r.user.id, cardId)

    // Validate target list access if moving
    if (typeof body.listId === 'string' && body.listId && body.listId !== card.listId) {
      const targetList = await requireListAccess(r.user.id, body.listId)
      if (targetList.boardId !== card.boardId) {
        throw Object.assign(new Error('BAD_REQUEST'), { statusCode: 400 })
      }
    }

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: {
        ...(typeof body.title === 'string' ? { title: body.title.trim() } : {}),
        ...(typeof body.description === 'string' ? { description: body.description } : {}),
        ...(typeof body.dueDate === 'string' ? { dueAt: dueDateToDueAt(body.dueDate) } : {}),
        ...(typeof body.archived === 'boolean'
          ? { archivedAt: body.archived ? new Date() : null }
          : {}),
        ...(typeof body.listId === 'string' ? { listId: body.listId } : {}),
        ...(typeof body.position === 'number' ? { position: body.position } : {})
      },
      include: {
        attachments: true
      }
    })

    return serializeCard(updated)
  })

  app.delete('/cards/:cardId', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    const cardId = String((req.params as any).cardId || '').trim()

    await requireCardAccess(r.user.id, cardId)
    await prisma.card.delete({ where: { id: cardId } })

    return { ok: true }
  })

  app.post('/boards/:boardId/reorder', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    const boardId = String((req.params as any).boardId || '').trim()
    const body = reorderSchema.parse(req.body)

    await requireBoardAccess(r.user.id, boardId)

    await prisma.$transaction(async (tx) => {
      if (Array.isArray(body.lists)) {
        await Promise.all(
          body.lists.map((l) =>
            tx.list.update({
              where: { id: l.id },
              data: { position: l.position }
            })
          )
        )
      }

      if (Array.isArray(body.cards)) {
        await Promise.all(
          body.cards.map((c) =>
            tx.card.update({
              where: { id: c.id },
              data: { listId: c.listId, position: c.position }
            })
          )
        )
      }
    })

    return { ok: true }
  })

  app.post('/cards/:cardId/attachments', { preHandler: app.auth }, async (req, reply) => {
    const r = req as AuthedRequest
    const cardId = String((req.params as any).cardId || '').trim()
    const body = createAttachmentSchema.parse(req.body)

    await requireCardAccess(r.user.id, cardId)

    const created = await prisma.attachment.create({
      data: {
        id: body.id,
        cardId,
        fileName: body.name,
        mimeType: body.type || null,
        sizeBytes: typeof body.size === 'number' ? body.size : null,
        url: body.url
      }
    })

    return reply.code(201).send(serializeAttachment(created))
  })

  app.delete('/attachments/:attachmentId', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    const attachmentId = String((req.params as any).attachmentId || '').trim()

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: {
        id: true,
        card: {
          select: {
            board: {
              select: {
                workspaceId: true
              }
            }
          }
        }
      }
    })

    if (!attachment) {
      return { ok: true }
    }

    await requireWorkspaceMembership(r.user.id, attachment.card.board.workspaceId)
    await prisma.attachment.delete({ where: { id: attachmentId } })

    return { ok: true }
  })
}
