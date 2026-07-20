'use client';

import dynamic from 'next/dynamic';

// `ssr: false` keeps mermaid out of the server render and the initial bundle —
// it's a large dependency and only a few pages have diagrams.
const MermaidContent = dynamic(() => import('./mermaid-content'), {
  ssr: false,
  loading: () => <div className="bg-fd-muted my-6 h-48 animate-pulse rounded-lg" />,
});

export function Mermaid({ chart }: { chart: string }) {
  return <MermaidContent chart={chart} />;
}
