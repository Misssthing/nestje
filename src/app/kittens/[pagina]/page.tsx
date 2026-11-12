import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { vindLanding } from '@/lib/landing';
import { createPublicClient } from '@/lib/supabase/public';
import OverzichtPagina, { type Zoek } from '../OverzichtPagina';
import { rasDelen } from '@/lib/nest';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ pagina: string }>; searchParams: Promise<Zoek> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pagina } = await params;
  const l = vindLanding(pagina);
  if (!l) return { title: 'Pagina niet gevonden', robots: { index: false } };
  // Een lege pagina (nu geen nestjes) niet in Google; zodra er nestjes zijn wel.
  const db = createPublicClient();
  const { data } = await db.from('openbare_overzicht').select('moeder_ras, vader_ras, provincie').limit(300);
  const heeft = (data ?? []).some((n) =>
    l.soort === 'provincie'
      ? n.provincie === l.naam
      : [...rasDelen(n.moeder_ras), ...rasDelen(n.vader_ras)].some((r) => r.toLowerCase() === l.naam.toLowerCase()),
  );
  return {
    title: l.titel,
    description: l.beschrijving,
    alternates: { canonical: `/kittens/${l.slug}` },
    robots: heeft ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: `${l.titel} | Nestje`, description: l.beschrijving, type: 'website', locale: 'nl_NL', siteName: 'Nestje', url: `/kittens/${l.slug}` },
  };
}

export default async function VastePagina({ params, searchParams }: Props) {
  const { pagina } = await params;
  const l = vindLanding(pagina);
  if (!l) notFound();
  const sp = await searchParams;
  return OverzichtPagina({ sp: { ...sp, [l.soort]: l.naam }, landing: l });
}
