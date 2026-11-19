import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';
import { KENNISCENTRUM_ARTIKELEN } from '@/lib/kenniscentrum';

export const metadata: Metadata = {
  title: 'Kenniscentrum',
  description: 'Alles wat je als koper of verkoper wilt weten over kittens: reserveren, gezondheidstesten en de eerste dagen in huis.',
  alternates: { canonical: '/kenniscentrum' },
};

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
        {KENNISCENTRUM_ARTIKELEN.map((a) => (
          <Link key={a.href} href={a.href} className="artikel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.afbeelding} alt="" loading="lazy" />
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
