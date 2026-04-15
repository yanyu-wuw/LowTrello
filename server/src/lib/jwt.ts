import jwt from 'jsonwebtoken'
import { env } from './env.js'

export type JwtPayload = {
  sub: string
  email: string
  name: string
}

export function signAccessToken(payload: JwtPayload) {
  const expiresIn = env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn']
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}
