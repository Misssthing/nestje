import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';

export const metadata: Metadata = { title: 'Afgemeld', robots: { index: false, follow: false } };

export default function Afgemeld() {
  return (
    <main className="wrap">
      <section className="hero">
        <h1>Je bent afgemeld</h1>
        <p>We hebben je aanmelding en je gegevens verwijderd. Je krijgt geen mails meer over deze raslijst.</p>
      </section>
      <div className="actions">
        <Link className="btn primary" href="/kittens">Bekijk de kittens</Link>
      </div>
      <Voet />
    </main>
  );
}
