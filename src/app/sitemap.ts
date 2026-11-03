import type { MetadataRoute } from 'next';
import { CONFIG } from '@/lib/config';
import { createPublicClient } from '@/lib/supabase/public';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vast: MetadataRoute.Sitemap = [
    { url: `${CONFIG.siteUrl}/kittens`, changeFrequency: 'daily', priority: 1 },
    { url: `${CONFIG.siteUrl}/huisregels`, changeFrequency: 'monthly', priority: 0.5 },
  ];
  try {
    // Alleen nestjes die de verkoper zelf in het openbare overzicht heeft gezet.
    const { data } = await createPublicClient()
      .from('openbare_overzicht')
      .select('slug, aangemaakt_op')
      .returns<{ slug: string; aangemaakt_op: string }[]>();
    const nesten: MetadataRoute.Sitemap = (data ?? []).map((n) => ({
      url: `${CONFIG.siteUrl}/n/${n.slug}`,
      lastModified: n.aangemaakt_op,
      changeFrequency: 'daily',
      priority: 0.7,
    }));
    return [...vast, ...nesten];
  } catch {
    return vast;
  }
}
