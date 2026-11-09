import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Voet from '@/components/Voet';
import { aftelling, datumNL } from '@/lib/nest';
import { haalNestOpSlug, nestIsOpen } from '@/lib/wachtlijst/acties';
import AanmeldFormulier from '@/app/wachtlijst/AanmeldFormulier';
import { meldAanVoorNest } from '@/app/wachtlijst/acties';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Interesse in dit nestje', robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

export default async function WachtlijstNest({ params }: Props) {
  const { slug } = await params;
  const nest = await haalNestOpSlug(slug);
  if (!nest || nest.verborgen) notFound();
  const open = await nestIsOpen(nest);
  const a = aftelling(nest.geboortedatum, nest.verhuisleeftijd_weken);

  return (
    <main className="wrap">
      <div className="bar">
        <Link href={`/n/${nest.slug}`} className="brand">← Het nestje van {nest.moeder_naam}</Link>
      </div>
      <section className="hero">
        <h1>Interesse in het nestje van {nest.moeder_naam}</h1>
        <p>
          {a.verwacht
            ? `De kittens van ${nest.moeder_naam} worden verwacht rond ${datumNL(a.geboren)}. Meld je nu al aan; je krijgt een mail zodra ze geboren zijn.`
            : 'Laat je gegevens achter. De verkoper ziet je aanmelding en kiest zelf wie een kitten krijgt aangeboden.'}
        </p>
      </section>

      {open ? (
        <>
          <ul className="wl-uitleg">
            <li>Krijg je een kitten aangeboden, dan krijg je een mail en heb je 72 uur om ja of nee te zeggen.</li>
            <li>Zeg je nee, dan blijf je gewoon op de wachtlijst staan.</li>
            <li>In elke mail staat een link om je gegevens te wijzigen of je af te melden.</li>
          </ul>
          <AanmeldFormulier
            actie={meldAanVoorNest}
            verborgen={{ slug: nest.slug }}
            knop="Aanmelden"
            uitleg="De verkoper ziet je naam, e-mailadres, woonplaats en wat je hierboven invult. Lees ook onze privacyverklaring."
          />
          <p className="hint">
            <Link href="/privacy">Privacyverklaring</Link> · <Link href="/huisregels">Huisregels</Link>
          </p>
        </>
      ) : (
        <div className="panel">
          <p style={{ marginTop: 0 }}>Alle kittens uit dit nestje hebben al een plek, dus aanmelden kan niet meer.</p>
          <div className="actions">
            <Link className="btn primary" href="/kittens">Bekijk andere nestjes</Link>
            <Link className="btn ghost" href="/wachtlijst/ras">Mail me bij nieuwe nestjes</Link>
          </div>
        </div>
      )}
      <Voet />
    </main>
  );
}
