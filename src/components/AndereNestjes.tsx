import Link from 'next/link';
import NestKaart from '@/components/NestKaart';
import { naarKaart } from '@/lib/kaart';
import { rasDelen } from '@/lib/nest';
import { createPublicClient } from '@/lib/supabase/public';
import type { OverzichtNest } from '@/lib/types';

type Props = { slug: string; moederRas: string | null; vaderRas: string | null };

/**
 * Andere nestjes uit het overzicht, onder een nestjespagina.
 * Volgorde: zelfde ras, dan zelfde provincie, dan de nieuwste. Maximaal 6.
 */
export default async function AndereNestjes({ slug, moederRas, vaderRas }: Props) {
  const { data } = await createPublicClient()
    .from('openbare_overzicht')
    .select('*')
    .order('aangemaakt_op', { ascending: false })
    .limit(200)
    .returns<OverzichtNest[]>();
  const alle = data ?? [];
  const provincie = alle.find((n) => n.slug === slug)?.provincie ?? null;
  const rassen = [...rasDelen(moederRas), ...rasDelen(vaderRas)].map((r) => r.toLowerCase());

  const score = (n: OverzichtNest) => {
    const zelfdeRas = [...rasDelen(n.moeder_ras), ...rasDelen(n.vader_ras)].some((r) => rassen.includes(r.toLowerCase()));
    return (zelfdeRas ? 2 : 0) + (provincie && n.provincie === provincie ? 1 : 0);
  };
  const andere = alle
    .filter((n) => n.slug !== slug)
    .map((n, i) => ({ n, s: score(n), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, 6)
    .map(({ n }) => naarKaart(n));
  if (!andere.length) return null;

  return (
    <section className="andere-nestjes" aria-labelledby="andere-nestjes">
      <div className="blokkop">
        <h2 id="andere-nestjes">Andere nestjes</h2>
        <Link href="/kittens" className="blokkop-link">Bekijk alles →</Link>
      </div>
      <div className="kaart-rij">
        {andere.map((k) => (
          <NestKaart key={k.slug} n={k} klein />
        ))}
      </div>
    </section>
  );
}
