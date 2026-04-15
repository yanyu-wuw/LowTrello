import dotenv from 'dotenv'

dotenv.config()

export const env = {
  PORT: Number(process.env.PORT || 8787),
  NODE_ENV: String(process.env.NODE_ENV || 'development'),
  CORS_ORIGIN: String(process.env.CORS_ORIGIN || 'http://localhost:5173'),
  JWT_SECRET: String(process.env.JWT_SECRET || ''),
  SMTP_HOST: String(process.env.SMTP_HOST || 'localhost'),
  SMTP_PORT: Number(process.env.SMTP_PORT || 1025),
  SMTP_FROM: String(process.env.SMTP_FROM || 'no-reply@lowtrello.local'),
  VERIFICATION_CODE_TTL_MINUTES: Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 10),
  VERIFICATION_CODE_RESEND_SECONDS: Number(process.env.VERIFICATION_CODE_RESEND_SECONDS || 60),
  VERIFICATION_CODE_MAX_ATTEMPTS: Number(process.env.VERIFICATION_CODE_MAX_ATTEMPTS || 5),

  PASSWORD_RESET_TTL_MINUTES: Number(process.env.PASSWORD_RESET_TTL_MINUTES || 10),
  PASSWORD_RESET_RESEND_SECONDS: Number(process.env.PASSWORD_RESET_RESEND_SECONDS || 60),
  PASSWORD_RESET_MAX_ATTEMPTS: Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS || 5),
  ACCESS_TOKEN_EXPIRES_IN: String(process.env.ACCESS_TOKEN_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m'),
  REFRESH_TOKEN_DAYS: Number(process.env.REFRESH_TOKEN_DAYS || 30),
  REFRESH_TOKEN_COOKIE_NAME: String(process.env.REFRESH_TOKEN_COOKIE_NAME || 'lowtrello_rt'),
  JWT_EXPIRES_IN: String(process.env.JWT_EXPIRES_IN || '7d'),
  DATABASE_URL: String(process.env.DATABASE_URL || '')
}

export function assertEnv() {
  const missing: string[] = []
  if (!env.JWT_SECRET) missing.push('JWT_SECRET')
  if (!env.DATABASE_URL) missing.push('DATABASE_URL')
  if (!env.SMTP_HOST) missing.push('SMTP_HOST')
  if (!env.SMTP_PORT) missing.push('SMTP_PORT')
  if (!env.SMTP_FROM) missing.push('SMTP_FROM')

  if (missing.length) {
    throw new Error(`Missing required env var(s): ${missing.join(', ')}`)
  }
}
