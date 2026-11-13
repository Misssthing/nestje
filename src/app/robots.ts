import type { MetadataRoute } from 'next';
import { CONFIG } from '@/lib/config';

/** Wat Google wel en niet mag bekijken: /robots.txt */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/beheer', '/login', '/auth', '/api', '/wachtlijst', '/nieuwsbrief'] },
    sitemap: `${CONFIG.siteUrl}/sitemap.xml`,
  };
}
