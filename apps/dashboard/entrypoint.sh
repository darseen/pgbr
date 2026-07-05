#!/bin/sh

set -e 

# check for AUTH_SECRET, generate if not set
if [ -z "${AUTH_SECRET}" ]; then
  echo ">>> AUTH_SECRET is not set. Generating a temporary one-time secret..."
  export AUTH_SECRET=$(openssl rand -base64 32)
  echo ">>> A new secret has been generated for this container instance."
else
  echo ">>> Using existing AUTH_SECRET provided by user."
fi

if [ -z "${BASE_URL}" ]; then
  echo ">>> BASE_URL is not set. It will be auto-detected from incoming requests."
else
  echo ">>> Using BASE_URL: ${BASE_URL}"
fi

# set a default path if PGBR_DATA isn't provided
export PGBR_DATA=${PGBR_DATA:-/var/lib/pgbr/data}

echo ">>> Ensuring database directory exists at $PGBR_DATA..."
mkdir -p "$PGBR_DATA"

echo ">>> Running database migrations..."
node packages/db/dist/migrate.js

exec "$@"