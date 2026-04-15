import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { assertEnv, env } from './lib/env.js'
import { verifyAccessToken } from './lib/jwt.js'
import { healthRoutes } from './routes/health.js'
import { authRoutes } from './routes/auth.js'
import { workspaceRoutes } from './routes/workspaces.js'
import { homeRoutes } from './routes/home.js'

declare module 'fastify' {
  interface FastifyInstance {
    auth: (req: any, reply: any) => Promise<void>
  }
}

type AuthedUser = { id: string; email: string; name: string }

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthedUser
  }
}

async function main() {
  assertEnv()

  const app = Fastify({ logger: true })

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true
  })

  await app.register(cookie)

  app.decorate('auth', async (req: any, reply: any) => {
    const header = String(req.headers.authorization || '')
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''

    if (!token) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' })
    }

    try {
      const payload = verifyAccessToken(token)
      req.user = { id: payload.sub, email: payload.email, name: payload.name }
    } catch {
      return reply.code(401).send({ error: 'UNAUTHORIZED' })
    }
  })

  await app.register(healthRoutes, { prefix: '/api' })
  await app.register(authRoutes, { prefix: '/api' })
  await app.register(workspaceRoutes, { prefix: '/api' })
  await app.register(homeRoutes, { prefix: '/api' })

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
