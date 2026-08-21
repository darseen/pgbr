import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { absoluteUrl } from '@/lib/shared';

export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl('/'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...source.getPages().map((page) => ({
      url: absoluteUrl(page.url),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
