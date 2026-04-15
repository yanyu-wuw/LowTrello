import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { signAccessToken } from '../lib/jwt.js'
import { env } from '../lib/env.js'
import {
  canResendVerificationCode,
  issueVerificationCode,
  verifyCodeForEmail
} from '../lib/emailVerification.js'
import {
  canResendPasswordResetCode,
  issuePasswordResetCode,
  verifyPasswordResetCode
} from '../lib/passwordReset.js'
import {
  findRefreshToken,
  issueRefreshToken,
  revokeAllRefreshTokensForUser,
  revokeRefreshTokenById
} from '../lib/refreshTokens.js'
import { ensureDefaultWorkspaceForUser } from '../lib/userBootstrap.js'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72),
  name: z.string().min(1).max(80)
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72)
})

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(12)
})

const resendSchema = z.object({
  email: z.string().email()
})

const requestPasswordResetSchema = z.object({
  email: z.string().email()
})

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(12),
  newPassword: z.string().min(6).max(72)
})

function isHttps(req: any) {
  const xfProto = req.headers?.['x-forwarded-proto']
  const proto = Array.isArray(xfProto) ? xfProto[0] : xfProto
  return proto === 'https' || req.protocol === 'https'
}

function setRefreshCookie(req: any, reply: any, refreshToken: string) {
  reply.setCookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps(req),
    path: '/api/auth'
  })
}

function clearRefreshCookie(reply: any) {
  reply.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, {
    path: '/api/auth'
  })
}

function readRefreshToken(req: any) {
  const fromCookie = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME]
  if (typeof fromCookie === 'string' && fromCookie) return fromCookie

  return ''
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (req, reply) => {
    const body = registerSchema.parse(req.body)
    const email = body.email.trim().toLowerCase()

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      if (exists.emailVerified) {
        return reply.code(409).send({ error: 'EMAIL_EXISTS' })
      }

      const can = await canResendVerificationCode(exists.id)
      if (can) {
        await issueVerificationCode(exists.id, email)
      }
      return reply.code(200).send({ ok: true, requiresVerification: true })
    }

    const passwordHash = await hashPassword(body.password)
    const user = await prisma.user.create({
      data: {
        email,
        name: body.name.trim(),
        passwordHash
      },
      select: { id: true, email: true, name: true }
    })

    await issueVerificationCode(user.id, email)
    return reply.code(201).send({ ok: true, requiresVerification: true })
  })

  app.post('/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body)
    const email = body.email.trim().toLowerCase()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS' })
    }

    const ok = await verifyPassword(body.password, user.passwordHash)
    if (!ok) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS' })
    }

    if (!user.emailVerified) {
      const can = await canResendVerificationCode(user.id)
      if (can) {
        await issueVerificationCode(user.id, email)
      }
      return reply.code(403).send({ error: 'EMAIL_NOT_VERIFIED' })
    }

    const workspaceId = await ensureDefaultWorkspaceForUser(user.id)
    await prisma.activity.create({
      data: {
        workspaceId,
        actorUserId: user.id,
        message: '登录到 LowTrello',
        status: 'done'
      }
    })

    const accessToken = signAccessToken({ sub: user.id, email: user.email, name: user.name })
    const { refreshToken } = await issueRefreshToken(user.id)

    setRefreshCookie(req, reply, refreshToken)
    return reply.send({
      accessToken,
      user: { id: user.id, email: user.email, name: user.name }
    })
  })

  app.post('/auth/verify', async (req, reply) => {
    const body = verifySchema.parse(req.body)
    const email = body.email.trim().toLowerCase()
    const code = body.code.trim()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' })
    }

    const r = await verifyCodeForEmail(user.id, email, code)
    if (!r.ok) {
      return reply.code(400).send({ error: r.reason })
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifiedAt: new Date()
      },
      select: { id: true, email: true, name: true }
    })

    const workspaceId = await ensureDefaultWorkspaceForUser(updated.id)

    await prisma.activity.createMany({
      data: [
        {
          workspaceId,
          actorUserId: updated.id,
          message: '完成注册并验证邮箱',
          status: 'done'
        },
        {
          workspaceId,
          actorUserId: null,
          message: '系统提示：欢迎使用 LowTrello！',
          status: 'seen'
        }
      ]
    })

    await prisma.notification.create({
      data: {
        userId: updated.id,
        message: '欢迎！你的账号已完成邮箱验证。',
        kind: 'direct',
        app: 'trello'
      }
    })

    const accessToken = signAccessToken({ sub: updated.id, email: updated.email, name: updated.name })
    const { refreshToken } = await issueRefreshToken(updated.id)

    setRefreshCookie(req, reply, refreshToken)
    return reply.send({ accessToken, user: updated })
  })

  app.post('/auth/resend-code', async (req, reply) => {
    const body = resendSchema.parse(req.body)
    const email = body.email.trim().toLowerCase()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Avoid account enumeration
      return reply.send({ ok: true })
    }

    if (user.emailVerified) {
      return reply.send({ ok: true })
    }

    const can = await canResendVerificationCode(user.id)
    if (!can) {
      return reply.code(429).send({ error: 'TOO_MANY_REQUESTS' })
    }

    await issueVerificationCode(user.id, email)
    return reply.send({ ok: true })
  })

  app.post('/auth/request-password-reset', async (req, reply) => {
    const body = requestPasswordResetSchema.parse(req.body)
    const email = body.email.trim().toLowerCase()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Avoid account enumeration
      return reply.send({ ok: true })
    }

    const can = await canResendPasswordResetCode(user.id)
    if (can) {
      await issuePasswordResetCode(user.id, email)
    }

    return reply.send({ ok: true })
  })

  app.post('/auth/reset-password', async (req, reply) => {
    const body = resetPasswordSchema.parse(req.body)
    const email = body.email.trim().toLowerCase()
    const code = body.code.trim()
    const newPassword = body.newPassword

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return reply.code(400).send({ error: 'RESET_FAILED' })
    }

    const r = await verifyPasswordResetCode(user.id, email, code)
    if (!r.ok) {
      return reply.code(400).send({ error: r.reason })
    }

    const passwordHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    })

    await revokeAllRefreshTokensForUser(user.id)

    const workspaceId = await ensureDefaultWorkspaceForUser(user.id)
    await prisma.activity.create({
      data: {
        workspaceId,
        actorUserId: user.id,
        message: '重置了账户密码',
        status: 'done'
      }
    })

    await prisma.notification.create({
      data: {
        userId: user.id,
        message: '你的密码已重置。如非本人操作，请尽快再次重置并检查登录状态。',
        kind: 'direct',
        app: 'trello'
      }
    })

    clearRefreshCookie(reply)
    return reply.send({ ok: true })
  })

  app.post('/auth/refresh', async (req, reply) => {
    const token = readRefreshToken(req)
    if (!token) {
      clearRefreshCookie(reply)
      return reply.code(401).send({ error: 'UNAUTHORIZED' })
    }

    const rec = await findRefreshToken(token)
    if (!rec) {
      clearRefreshCookie(reply)
      return reply.code(401).send({ error: 'UNAUTHORIZED' })
    }

    if (rec.expiresAt.getTime() <= Date.now()) {
      clearRefreshCookie(reply)
      return reply.code(401).send({ error: 'UNAUTHORIZED' })
    }

    // Reuse detection: a revoked refresh token being used again likely means it was stolen.
    // Invalidate all refresh tokens for that user to force re-login everywhere.
    if (rec.revokedAt) {
      await revokeAllRefreshTokensForUser(rec.userId)
      clearRefreshCookie(reply)
      return reply.code(401).send({ error: 'UNAUTHORIZED' })
    }

    const user = await prisma.user.findUnique({
      where: { id: rec.userId },
      select: { id: true, email: true, name: true, emailVerified: true }
    })

    if (!user) {
      clearRefreshCookie(reply)
      return reply.code(401).send({ error: 'UNAUTHORIZED' })
    }

    if (!user.emailVerified) {
      clearRefreshCookie(reply)
      return reply.code(401).send({ error: 'UNAUTHORIZED' })
    }

    const { refreshToken: newRefreshToken, record: newRec } = await issueRefreshToken(user.id)
    await revokeRefreshTokenById(rec.id, newRec.id)

    const accessToken = signAccessToken({ sub: user.id, email: user.email, name: user.name })
    setRefreshCookie(req, reply, newRefreshToken)

    return reply.send({ accessToken, user })
  })

  app.post('/auth/logout', async (req, reply) => {
    const token = readRefreshToken(req)
    if (token) {
      const rec = await findRefreshToken(token)
      if (rec && !rec.revokedAt) await revokeRefreshTokenById(rec.id)
    }

    clearRefreshCookie(reply)
    return reply.send({ ok: true })
  })
}
