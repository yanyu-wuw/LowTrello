#!/bin/sh
set -e

if [ -n "${DATABASE_URL:-}" ] && [ "${PRISMA_DB_PUSH:-1}" = "1" ]; then
  echo "[api] Prisma db push..."
  if [ "${PRISMA_ACCEPT_DATA_LOSS:-0}" = "1" ]; then
    echo "[api] PRISMA_ACCEPT_DATA_LOSS=1 (dangerous): allow destructive changes."
    ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss
  else
    ./node_modules/.bin/prisma db push --skip-generate
  fi
fi

exec "$@"
