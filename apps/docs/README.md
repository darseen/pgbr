# pgbr docs

The documentation site for [pgbr](https://github.com/darseen/pgbr), built with
[Next.js](https://nextjs.org) and [Fumadocs](https://fumadocs.dev).

## Running it

From the repository root:

```bash
pnpm install
pnpm --filter docs dev
```

Then open http://localhost:3001. The port is pinned to 3001 so the docs and the
pgbr dashboard (3000) can run side by side.

This app is self-contained: unlike the other workspace apps it needs no database
or object storage, and no environment variables.

## Writing content

Pages are MDX files under `content/docs/`. The file path becomes the URL —
`content/docs/guides/backups.mdx` serves at `/docs/guides/backups`.

Every page needs frontmatter:

```mdx
---
title: Page Title
description: One line shown under the title and in search results.
---
```

Sidebar order is controlled by `meta.json` in each folder. Pages are listed by
filename without the extension; anything not listed still renders but is appended
after the ordered entries.

```json
{
  "title": "Guides",
  "icon": "BookOpen",
  "pages": ["databases", "backups", "restores"]
}
```

Icons are [Lucide](https://lucide.dev) names, resolved by the source loader's
`lucideIconsPlugin`.

### Components

These are registered globally in `components/mdx.tsx`, so MDX files use them
without importing anything: `Callout`, `Card`/`Cards`, `Tabs`/`Tab`,
`Steps`/`Step`, `Accordions`/`Accordion`, `Files`/`Folder`/`File`, `TypeTable`,
and `Mermaid`.

Diagrams are written as plain ` ```mermaid ` code fences — the `remarkMdxMermaid`
plugin in `source.config.ts` converts them into the `Mermaid` component, which
renders client-side and follows the active theme.

## Layout

| Path | Purpose |
| --- | --- |
| `content/docs/` | The documentation content |
| `lib/shared.ts` | App name, GitHub repo, route constants |
| `lib/source.ts` | Content source adapter |
| `lib/layout.shared.tsx` | Nav and layout options |
| `app/(home)/` | The landing page |
| `app/docs/` | Docs layout and page renderer |
| `app/api/search/route.ts` | Orama search endpoint |
| `components/mdx.tsx` | Global MDX component registry |
| `source.config.ts` | Frontmatter schemas and MDX plugins |

## Checks

```bash
pnpm --filter docs build
pnpm --filter docs lint
pnpm --filter docs check-types
```

All three also run as part of the root `pnpm build` / `pnpm lint` /
`pnpm check-types`, and in CI.
