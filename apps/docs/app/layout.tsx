import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { appName, siteUrl } from '@/lib/shared';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'pgbr — PostgreSQL Backup & Restore',
    template: '%s | pgbr',
  },
  description:
    'Self-hosted PostgreSQL backup, restore, and migration tool. Documentation for installing, configuring, and operating pgbr.',
  applicationName: appName,
  // og/twitter titles and descriptions are inherited from the fields above.
  openGraph: {
    type: 'website',
    siteName: appName,
    locale: 'en_US',
    url: siteUrl,
  },
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
