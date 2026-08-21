export const appName = 'pgbr';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

// Canonicals, OG images, sitemap, and robots all need absolute URLs.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export const gitConfig = {
  user: 'darseen',
  repo: 'pgbr',
  branch: 'main',
};

// This site lives inside the pgbr monorepo, so "edit on GitHub" links need the
// app's path prefix rather than pointing at the repository root.
export const contentPathPrefix = 'apps/docs/content/docs';
