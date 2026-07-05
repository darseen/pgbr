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

# check for BASE_URL
if [ -z "${BASE_URL}" ]; then
  if [ "${NODE_ENV}" = "production" ]; then
    echo ">>> ERROR: BASE_URL must be set in production. Set it to the URL of your pgbr instance (e.g. http://<your-server-ip>:3000)." >&2
    exit 1
  fi
  echo ">>> BASE_URL is not set. Please set BASE_URL to the URL of your pgbr instance."
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