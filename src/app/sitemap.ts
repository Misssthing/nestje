import type { MetadataRoute } from 'next';
import { CONFIG } from '@/lib/config';
import { LANDINGS } from '@/lib/landing';
import { rasDelen } from '@/lib/nest';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

/** Lijst van alle openbare pagina's voor Google: /sitemap.xml */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (pad: string) => `${CONFIG.siteUrl}${pad}`;
  const db = createPublicClient();
  const [{ data: nesten }, { data: catteries }] = await Promise.all([
    db.from('openbare_overzicht').select('slug, moeder_ras, vader_ras, provincie, aangemaakt_op').limit(1000),
    db.from('openbare_catteries').select('link, profiel'),
  ]);
  const lijst = nesten ?? [];

  // Alleen vaste pagina's met nestjes erop
  const rassen = new Set(lijst.flatMap((n) => [...rasDelen(n.moeder_ras), ...rasDelen(n.vader_ras)].map((r) => r.toLowerCase())));
  const provincies = new Set(lijst.map((n) => n.provincie).filter(Boolean));
  const vast = LANDINGS.filter((l) => (l.soort === 'ras' ? rassen.has(l.naam.toLowerCase()) : provincies.has(l.naam)));

  return [
    { url: url('/kittens'), changeFrequency: 'daily', priority: 1 },
    { url: url('/catteries'), changeFrequency: 'weekly', priority: 0.7 },
    ...vast.map((l) => ({ url: url(`/kittens/${l.slug}`), changeFrequency: 'daily' as const, priority: 0.8 })),
    ...lijst.map((n) => ({ url: url(`/n/${n.slug}`), lastModified: n.aangemaakt_op, changeFrequency: 'daily' as const, priority: 0.6 })),
    ...(catteries ?? []).filter((c) => c.profiel).map((c) => ({ url: url(c.link), changeFrequency: 'weekly' as const, priority: 0.5 })),
  ];
}
