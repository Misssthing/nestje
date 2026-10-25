import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Voet from '@/components/Voet';
import { haalNestje } from '../data';
import MeldForm from './MeldForm';

export const metadata: Metadata = { title: 'Nestje melden', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Melden({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await haalNestje(slug);
  if (!data) notFound();
  return (
    <main className="wrap">
      <div className="bar">
        <Link href={`/n/${slug}`} className="brand">Nestje</Link>
      </div>
      <section className="hero">
        <h1>Nestje melden</h1>
        <p>
          Klopt er iets niet aan het nestje van {data.nest.moeder_naam}? Denk aan misleidende informatie, oplichting of zorgen
          over het welzijn van de dieren. Vertel kort wat er speelt. We bekijken elke melding.
        </p>
      </section>
      <MeldForm slug={slug} />
      <Voet />
    </main>
  );
}
