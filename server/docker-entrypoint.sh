#!/bin/sh
set -e

if [ -n "${DATABASE_URL:-}" ] && [ "${PRISMA_DB_PUSH:-1}" = "1" ]; then
  echo "[api] Prisma db push..."
  ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss
fi

exec "$@"
