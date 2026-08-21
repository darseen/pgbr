import { generate as DefaultImage } from 'fumadocs-ui/og';
import { ImageResponse } from 'next/og';
import { appName } from '@/lib/shared';

export const alt = 'pgbr, self-hosted PostgreSQL backup and restore';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <DefaultImage
      title="PostgreSQL Backup & Restore"
      description="Self-hosted backup, restore, and migration for PostgreSQL, with a clean web interface over pg_dump and pg_restore."
      site={appName}
    />,
    size,
  );
}
