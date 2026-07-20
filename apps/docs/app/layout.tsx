import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  // Absolute URLs for OG images. Override via NEXT_PUBLIC_SITE_URL when deploying.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001',
  ),
  title: {
    default: 'pgbr — PostgreSQL Backup & Restore',
    template: '%s | pgbr',
  },
  description:
    'Self-hosted PostgreSQL backup, restore, and migration tool. Documentation for installing, configuring, and operating pgbr.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
