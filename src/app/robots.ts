import type { MetadataRoute } from 'next';
import { CONFIG } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/beheer', '/auth/', '/login', '/n/'] },
    host: CONFIG.siteUrl,
  };
}
