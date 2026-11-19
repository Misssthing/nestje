import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';

export const metadata: Metadata = {
  title: 'Kenniscentrum',
  description: 'Alles wat je als koper of verkoper wilt weten over kittens: reserveren, gezondheidstesten en de eerste dagen in huis.',
  alternates: { canonical: '/kenniscentrum' },
};

const ARTIKELEN = [
  {
    titel: 'Een kitten reserveren voor hij geboren is',
    intro: 'Waar je op moet letten, welke vragen je stelt, en hoe je een serieuze fokker herkent.',
    href: '/kitten-reserveren',
  },
  {
    titel: 'Gezondheidstesten bij kittens, uitgelegd',
    intro: 'DNA-test of hartecho? Wat betekent "Drager"? En is een getest ouderdier een garantie voor de kitten zelf?',
    href: '/gezondheidstesten-kittens',
  },
  {
    titel: 'De eerste dagen met je kitten',
    intro: 'Zo laat je een kitten rustig wennen in huis: de wenkamer, andere huisdieren, eten en de dierenarts.',
    href: '/eerste-dagen',
  },
];

export default function Kenniscentrum() {
  return (
    <main className="wrap tekst">
      <div className="bar">
        <Link href="/kittens" className="brand">Nestje</Link>
      </div>

      <h1>Kenniscentrum</h1>
      <p>
        Alles wat je als koper of verkoper wilt weten over kittens, in gewone taal uitgelegd.
      </p>

      <div className="artikel-grid" style={{ marginTop: 20, marginBottom: 32 }}>
        {ARTIKELEN.map((a) => (
          <Link key={a.href} href={a.href} className="artikel">
            <span className="artikel-geenfoto" aria-hidden="true" />
            <span className="artikel-tekst">
              <strong>{a.titel}</strong>
              <span className="artikel-intro">{a.intro}</span>
            </span>
          </Link>
        ))}
      </div>

      <Voet />
    </main>
  );
}
