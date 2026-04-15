import crypto from 'node:crypto'
import { prisma } from './prisma.js'
import { env } from './env.js'

function base64Url(input: Buffer) {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export function generateRefreshToken() {
  return base64Url(crypto.randomBytes(48))
}

export function hashRefreshToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function refreshTokenExpiresAt(now = new Date()) {
  const days = env.REFRESH_TOKEN_DAYS
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
}

export async function issueRefreshToken(userId: string) {
  const refreshToken = generateRefreshToken()
  const tokenHash = hashRefreshToken(refreshToken)

  const record = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: refreshTokenExpiresAt()
    }
  })

  return { refreshToken, record }
}

export async function findRefreshToken(token: string) {
  const tokenHash = hashRefreshToken(token)
  return prisma.refreshToken.findUnique({ where: { tokenHash } })
}

export async function findValidRefreshToken(token: string) {
  const tokenHash = hashRefreshToken(token)
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } })
  if (!record) return null
  if (record.revokedAt) return null
  if (record.expiresAt.getTime() <= Date.now()) return null
  return record
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  })
}

export async function revokeRefreshTokenById(id: string, replacedByTokenId?: string) {
  await prisma.refreshToken.update({
    where: { id },
    data: {
      revokedAt: new Date(),
      replacedByTokenId: replacedByTokenId || null
    }
  })
}
