import crypto from 'node:crypto'
import { prisma } from './prisma.js'
import { env } from './env.js'
import { sendMail } from './smtp.js'

function codePepper() {
  return String(process.env.PASSWORD_RESET_CODE_PEPPER || env.JWT_SECRET)
}

function generateResetCode() {
  const n = crypto.randomInt(0, 1_000_000)
  return String(n).padStart(6, '0')
}

function hashResetCode(email: string, code: string) {
  const input = `${codePepper()}:${email.trim().toLowerCase()}:${code}`
  return crypto.createHash('sha256').update(input).digest('hex')
}

function resetCodeExpiresAt(now = new Date()) {
  const minutes = env.PASSWORD_RESET_TTL_MINUTES
  return new Date(now.getTime() + minutes * 60 * 1000)
}

export async function canResendPasswordResetCode(userId: string) {
  const latest = await prisma.passwordResetCode.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })

  if (!latest) return true

  const waitMs = env.PASSWORD_RESET_RESEND_SECONDS * 1000
  return Date.now() - latest.createdAt.getTime() >= waitMs
}

export async function issuePasswordResetCode(userId: string, email: string) {
  const code = generateResetCode()
  const codeHash = hashResetCode(email, code)

  await prisma.passwordResetCode.create({
    data: {
      userId,
      codeHash,
      expiresAt: resetCodeExpiresAt()
    }
  })

  await sendMail({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    from: env.SMTP_FROM,
    to: email,
    subject: 'LowTrello 密码重置验证码',
    text: `你的密码重置验证码是：${code}\n\n有效期：${env.PASSWORD_RESET_TTL_MINUTES} 分钟。\n如果不是你本人操作，请忽略。`
  })
}

export async function verifyPasswordResetCode(userId: string, email: string, code: string) {
  const record = await prisma.passwordResetCode.findFirst({
    where: {
      userId,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!record) {
    return { ok: false as const, reason: 'CODE_NOT_FOUND' as const }
  }

  const codeHash = hashResetCode(email, code)
  if (record.codeHash !== codeHash) {
    const attempts = record.attempts + 1
    await prisma.passwordResetCode.update({
      where: { id: record.id },
      data: {
        attempts,
        consumedAt: attempts >= env.PASSWORD_RESET_MAX_ATTEMPTS ? new Date() : null
      }
    })

    return { ok: false as const, reason: 'INVALID_CODE' as const }
  }

  await prisma.passwordResetCode.update({
    where: { id: record.id },
    data: {
      consumedAt: new Date()
    }
  })

  return { ok: true as const }
}
