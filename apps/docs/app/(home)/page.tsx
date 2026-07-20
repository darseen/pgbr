import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/images/pgbr.png';

const features = [
  {
    title: 'Full pg_dump / pg_restore control',
    description:
      'Every native flag — formats, filters, parallel jobs — configured from the UI and validated before the job is queued.',
  },
  {
    title: 'Scheduled backups',
    description:
      'Cron schedules with timezones and per-schedule retention, reconciled from Postgres on every worker boot.',
  },
  {
    title: 'S3-compatible storage',
    description:
      'Artifacts live in object storage. Bundled SeaweedFS for zero setup; point at S3, R2, or Backblaze when you scale.',
  },
  {
    title: 'One-click migrations',
    description:
      'Stream pg_dump straight into pg_restore to move a database to a new host without staging a file.',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-20">
      <div className="w-full max-w-3xl text-center">
        <Image
          src={logo}
          alt="pgbr logo"
          className="mx-auto mb-4 size-16 rounded-2xl"
          priority
        />
        <h1 className="mb-4 text-4xl font-bold tracking-tight">pgbr</h1>
        <p className="text-fd-muted-foreground mb-8 text-lg">
          Self-hosted PostgreSQL backup, restore, and migration — a clean web
          interface over the tools you already trust.
        </p>
        <div className="mb-16 flex flex-wrap justify-center gap-3">
          <Link
            href="/docs"
            className="bg-fd-primary text-fd-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium"
          >
            Read the docs
          </Link>
          <Link
            href="/docs/getting-started/installation"
            className="border-fd-border rounded-lg border px-5 py-2.5 text-sm font-medium"
          >
            Install pgbr
          </Link>
        </div>

        <div className="grid gap-4 text-left sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="border-fd-border bg-fd-card rounded-lg border p-5"
            >
              <h2 className="mb-1.5 font-semibold">{feature.title}</h2>
              <p className="text-fd-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
