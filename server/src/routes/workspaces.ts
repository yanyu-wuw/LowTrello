import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

type AuthedRequest = FastifyRequest & { user: { id: string; email: string; name: string } }

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(2000).optional()
})

export async function workspaceRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    return { id: r.user.id, email: r.user.email, name: r.user.name }
  })

  app.get('/workspaces', { preHandler: app.auth }, async (req) => {
    const r = req as AuthedRequest
    const list = await prisma.workspaceMember.findMany({
      where: { userId: r.user.id },
      include: { workspace: true },
      orderBy: { createdAt: 'desc' }
    })

    return list.map((m: any) => ({
      role: m.role,
      workspace: {
        id: m.workspace.id,
        name: m.workspace.name,
        description: m.workspace.description,
        createdAt: m.workspace.createdAt
      }
    }))
  })

  app.post('/workspaces', { preHandler: app.auth }, async (req, reply) => {
    const r = req as AuthedRequest
    const body = createWorkspaceSchema.parse(req.body)

    const workspace = await prisma.workspace.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        members: {
          create: {
            userId: r.user.id,
            role: 'admin'
          }
        }
      }
    })

    return reply.code(201).send({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      createdAt: workspace.createdAt
    })
  })
}
