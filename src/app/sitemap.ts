import type { MetadataRoute } from 'next';
import { CONFIG } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${CONFIG.siteUrl}/kittens`, changeFrequency: 'daily', priority: 1 }];
}
