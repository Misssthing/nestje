import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';
import { RASLIJST_RASSEN } from '@/lib/wachtlijst/server';
import AanmeldFormulier from '../AanmeldFormulier';
import { meldAanVoorRas } from '../acties';

export const metadata: Metadata = {
  title: 'Mail me bij een nieuw nestje',
  description: 'Krijg een mail zodra er een nieuw nestje met stamboom van jouw ras op Nestje komt.',
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ ras?: string }> };

export default async function Raslijst({ searchParams }: Props) {
  const { ras } = await searchParams;
  const gekozen = ras && RASLIJST_RASSEN.includes(ras) ? ras : '';

  return (
    <main className="wrap">
      <div className="bar">
        <Link href="/kittens" className="brand">← Alle kittens</Link>
      </div>
      <section className="hero">
        <h1>Mail me bij een nieuw nestje</h1>
        <p>
          Kies een ras. Komt er een nieuw nestje met stamboom van dat ras op Nestje, dan krijg je een mail. Met één klik meld
          je je dan aan voor de wachtlijst van dat nestje.
        </p>
      </section>
      <ul className="wl-uitleg">
        <li>Alleen nestjes met stamboom, van verkopers die zich aan de <Link href="/huisregels">huisregels</Link> houden.</li>
        <li>Verkopers zien deze lijst niet. Pas als jij je voor een nestje aanmeldt, krijgt die verkoper je gegevens.</li>
        <li>Je aanmelding geldt een jaar. Daarna vragen we of je wilt blijven.</li>
      </ul>
      <AanmeldFormulier
        actie={meldAanVoorRas}
        rassen={RASLIJST_RASSEN}
        waarden={{ ras: gekozen }}
        knop="Aanmelden"
        uitleg="Je krijgt eerst een mail om je e-mailadres te bevestigen. Wat je bij Voorkeur en Iets over jezelf invult, sturen we mee als je je voor een nestje aanmeldt."
      />
      <p className="hint"><Link href="/privacy">Privacyverklaring</Link></p>
      <Voet />
    </main>
  );
}
