<div align="center">

<img src="./.github/images/pgbr.png" alt="logo" width="200" style="border-radius: 16px">

<br/>

[![Version](https://img.shields.io/github/v/tag/darseen/pgbr?style=for-the-badge&label=version)](https://github.com/darseen/pgbr/pkgs/container/pgbr-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
<br/>
<br/>
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/pgbr?referralCode=InkF11&utm_medium=integration&utm_source=template&utm_campaign=generic)

# PGBR | PostgreSQL Backup & Restore

**pgbr** is a self-hosted tool built for developers who need reliable database backups. Manage your PostgreSQL backups with confidence by creating, restoring, migrating, and managing database backups using customizable flags and one-click operations directly from a clean web interface.

</div>

## Features

- **Secure Connection Storage**: Keep your database credentials safe with encrypted connection strings and masked UI displays.

- **Full `pg_dump`/`pg_restore` Support**: Gain complete control over your operations by configuring all native backup and restore flags directly through the interface.

- **Automated Backups**: Never miss a backup. Set up customizable cron jobs to automatically back up your databases on a schedule that works for you.

- **Seamless Migrations**: Easily migrate data from one PostgreSQL database to another with one-click data transfer tools.

## Getting Started

pgbr runs as three services: the **dashboard** (web UI + API), the **worker** (runs `pg_dump`/`pg_restore` jobs from a queue), and **Redis** (job queue backing store), all sharing a Postgres database and a data volume. Docker Compose is the easiest way to run all of them together.

### 1\. Pull the Docker Images

Bash

```
docker pull ghcr.io/darseen/pgbr-dashboard:latest
docker pull ghcr.io/darseen/pgbr-worker:latest
```

### 2\. Configure Your Environment

The dashboard and the worker share the same `PGBR_DATA` volume, `DATABASE_URL`, `REDIS_URL`, and `ENCRYPTION_KEY` (the worker uses it to decrypt connection strings pulled off the queue). Put the shared values in one `.env` file and pass it to both containers so you don't have to keep two copies in sync:

```
DATABASE_URL=postgresql://user:pass@host:5432/pgbr
REDIS_URL=redis://redis:6379
ENCRYPTION_KEY=your-encryption-key
AUTH_SECRET=your-secret-key
```

`AUTH_SECRET` is only used by the dashboard, but it's harmless for the worker to also receive it from the shared file. `BASE_URL` is optional — see [Environment Variables](#environment-variables) — add it here too if you're behind a reverse proxy that needs it set explicitly.

### 3\. Run the Containers

Bash

```
docker network create pgbr

docker run -d --network pgbr --name redis redis:8-alpine

docker run -d --network pgbr \
  -p 3000:3000 \
  -v /path/on/your/machine:/var/lib/pgbr/data \
  --env-file .env \
  --name pgbr \
  ghcr.io/darseen/pgbr-dashboard:latest

docker run -d --network pgbr \
  -v /path/on/your/machine:/var/lib/pgbr/data \
  --env-file .env \
  --name pgbr-worker \
  ghcr.io/darseen/pgbr-worker:latest
```

See `compose.yaml` in this repo for a full local development setup (Postgres, Redis, dashboard, and worker wired together).

### 4\. Initial Setup

Once the containers are running, you need to create your admin user to start managing your databases.

1.  Navigate to your server's IP address on port 3000 in your web browser: `http://<your-server-ip>:3000`

2.  You will be prompted to register. The first user to register automatically becomes the admin.

3.  Log in, add your first PostgreSQL connection, and start managing your backups!

## Environment Variables

The following environment variables should be set for optimal security and configuration.

- `PGBR_DATA`: The path to your data directory. Must be the same for the dashboard and the worker.

- `DATABASE_URL`: The Postgres connection string for pgbr's own metadata database.

- `REDIS_URL`: The Redis connection string used for the backup/restore/migrate job queue. Required by both the dashboard and the worker.

- `ENCRYPTION_KEY`: Used to encrypt/decrypt stored connection strings. Must be identical on the dashboard and the worker.

- `AUTH_SECRET`: A secure, random string used to sign user sessions. Dashboard only.

- `BASE_URL`: The base URL of your pgbr instance. Dashboard only, optional — auto-detected from incoming requests if unset. Set it explicitly only if you're behind a reverse proxy that doesn't forward the `Host` header correctly.

- `WORKER_CONCURRENCY`: How many jobs each queue (backup/restore/migrate) processes concurrently. Worker only, defaults to `5`.

## Screenshots

Here is a look at the pgbr interface.

<div align="center">
  <h3> Dashboard View  </h3>
  <img src="./.github/images/dashboard.png" alt="Dashboard View" width="100%"/>
</div>

<div align="center">
  <h3> Backup Management Page </h3>
  <img src="./.github/images/backups.png" alt="Backup Management Interface" width="100%"/>
</div>

<div align="center">
  <h3> Migration Tool </h3>
  <img src="./.github/images/migrate.png" alt="Migration Tool" width="100%"/>
</div>

## Contributing

Contributions are welcome! If you'd like to help improve pgbr by adding new flags, UI improvements, or features, please feel free to fork the repository, make changes, and submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
