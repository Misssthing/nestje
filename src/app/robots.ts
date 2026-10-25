import type { MetadataRoute } from 'next';
import { CONFIG } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/beheer', '/auth/', '/api/'] },
    host: CONFIG.siteUrl,
  };
}
