import type { Metadata } from 'next';
import { landingVoor } from '@/lib/landing';
import OverzichtPagina, { type Zoek } from './OverzichtPagina';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Zoek> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, ras, provincie, soort, vrij, binnen4, geslacht } = await searchParams;
  const gefilterd = Boolean(q || ras || provincie || soort || vrij || binnen4 || geslacht);
  // Alleen een ras of alleen een provincie gekozen? Dan is de vaste pagina daarvoor de echte versie voor Google.
  const vast =
    ras && !provincie && !q && !soort && !vrij && !binnen4 && !geslacht
      ? landingVoor('ras', ras)
      : provincie && !ras && !q && !soort && !vrij && !binnen4 && !geslacht
        ? landingVoor('provincie', provincie)
        : null;
  return {
    title: 'Kittens te koop',
    description:
      'Bekijk nestjes kittens van hobbyverkopers en fokkers in Nederland en België. Zie meteen welke kittens nog vrij zijn en wanneer ze mogen verhuizen.',
    alternates: { canonical: vast ? `/kittens/${vast.slug}` : '/kittens' },
    // Gefilterde varianten niet apart in Google; de hoofdpagina wel.
    robots: gefilterd ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title: 'Kittens te koop | Nestje', type: 'website', locale: 'nl_NL', siteName: 'Nestje', url: '/kittens' },
  };
}


export default async function Overzicht({ searchParams }: Props) {
  return OverzichtPagina({ sp: await searchParams });
}
