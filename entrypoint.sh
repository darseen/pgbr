#!/bin/sh

set -e 

if [ -z "${AUTH_SECRET}" ]; then
  echo ">>> AUTH_SECRET is not set. Generating a temporary one-time secret..."
  export AUTH_SECRET=$(openssl rand -base64 32)
  echo ">>> A new secret has been generated for this container instance."
else
  echo ">>> Using existing AUTH_SECRET provided by user."
fi

# set a default path if PGBR_DATA isn't provided
export PGBR_DATA=${PGBR_DATA:-/var/lib/pgbr/data}

echo ">>> Ensuring database directory exists at $PGBR_DATA..."
mkdir -p "$PGBR_DATA"

echo ">>> Running database migrations..."
pnpm db:generate
pnpm db:migrate

echo ">>> Starting application..."
exec "$@"