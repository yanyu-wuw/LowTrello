import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { ensureDefaultWorkspaceForUser } from '../lib/userBootstrap.js'

type AuthedRequest = FastifyRequest & { user: { id: string; email: string; name: string } }

const recentQuerySchema = z.object({
  tab: z.enum(['done', 'seen']).optional().default('done'),
  q: z.string().optional().default(''),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30)
})

const notificationsQuerySchema = z.object({
  time: z.enum(['all', 'today']).optional().default('all'),
  kind: z.enum(['direct', 'watching']).optional(),
  app: z.enum(['all', 'trello', 'jira', 'confluence']).optional().default('all'),
  unreadOnly: z
    .string()
    .optional()
    .transform((v) => v === '1' || v === 'true')
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30)
})

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export async function homeRoutes(app: FastifyInstance) {
  app.get('/home/recent', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    const query = recentQuerySchema.parse(req.query)

    await ensureDefaultWorkspaceForUser(r.user.id)

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: r.user.id },
      select: { workspaceId: true }
    })

    const workspaceIds = memberships.map((m) => m.workspaceId)

    const items = await prisma.activity.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        status: query.tab,
        ...(query.q
          ? {
              message: {
                contains: query.q,
                mode: 'insensitive'
              }
            }
          : {})
      },
      include: {
        board: { select: { title: true } },
        actor: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit
    })

    return {
      items: items.map((it) => {
        const meta = it.board?.title
          ? `面板 · ${it.board.title}`
          : it.actor?.name
            ? `账号 · ${it.actor.name}`
            : '系统 · LowTrello'

        return {
          id: it.id,
          title: it.message,
          meta,
          status: it.status,
          createdAt: it.createdAt.toISOString()
        }
      })
    }
  })

  app.get('/home/notifications', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    const query = notificationsQuerySchema.parse(req.query)

    const where: any = {
      userId: r.user.id
    }

    if (query.unreadOnly) {
      where.readAt = null
    }

    if (query.time === 'today') {
      where.createdAt = { gte: startOfToday() }
    }

    if (query.kind) {
      where.kind = query.kind
    }

    if (query.app && query.app !== 'all') {
      where.app = query.app
    }

    const list = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit
    })

    return {
      items: list.map((it) => ({
        id: it.id,
        message: it.message,
        kind: it.kind,
        app: it.app,
        createdAt: it.createdAt.toISOString(),
        readAt: it.readAt ? it.readAt.toISOString() : null
      }))
    }
  })
}
