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
  echo ">>> WARNING: BASE_URL is not set. Sign-in will fail with 'Invalid origin'"
  echo ">>> unless you reach the dashboard directly on localhost. Set it to the"
  echo ">>> public URL you open in the browser, e.g. https://pgbr.example.com"
else
  echo ">>> Using BASE_URL: ${BASE_URL}"
fi

echo ">>> Running database migrations..."
node packages/db/dist/migrate.js

exec "$@"