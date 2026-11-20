import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Voet from '@/components/Voet';
import { haalNestOpSlug } from '@/lib/wachtlijst/acties';
import { adminClient, isUuid } from '@/lib/wachtlijst/server';
import { meldAanViaRas } from '../../../../acties';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Aanmelden voor dit nestje', robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string; slug: string }>; searchParams: Promise<{ fout?: string }> };

export default async function AanmeldenViaRas({ params, searchParams }: Props) {
  const { token, slug } = await params;
  const { fout } = await searchParams;
  if (!isUuid(token)) notFound();
  const { data: r } = await adminClient()
    .from('wachtlijst_ras').select('naam, email, woonplaats, voorkeur_geslacht, voorkeur_vacht, motivatie, bevestigd_op')
    .eq('token', token).maybeSingle();
  const nest = await haalNestOpSlug(slug);
  if (!r || !r.bevestigd_op || !nest || nest.verborgen) notFound();

  const voorkeur = { geen: 'geen voorkeur', kater: 'kater', poes: 'poes' }[r.voorkeur_geslacht as 'geen' | 'kater' | 'poes'];

  return (
    <main className="wrap">
      <div className="bar">
        <Link href={`/n/${nest.slug}`} className="brand">← Het nestje van {nest.moeder_naam}</Link>
      </div>
      <section className="hero">
        <h1>Aanmelden voor het nestje van {nest.moeder_naam}</h1>
        <p>Deze gegevens sturen we naar de verkoper:</p>
      </section>
      <dl className="panel wl-gegevens">
        <dt>Naam</dt><dd>{r.naam}</dd>
        <dt>E-mail</dt><dd>{r.email}</dd>
        <dt>Woonplaats</dt><dd>{r.woonplaats}</dd>
        <dt>Voorkeur</dt><dd>{[voorkeur, r.voorkeur_vacht].filter(Boolean).join(', ')}</dd>
        {r.motivatie && (<><dt>Over jou</dt><dd>{r.motivatie}</dd></>)}
      </dl>
      {fout && <p className="fout" role="alert">{fout}</p>}
      <form action={meldAanViaRas} className="actions">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="slug" value={nest.slug} />
        <button className="btn primary" type="submit">Zet me op de wachtlijst</button>
        <Link className="btn ghost" href={`/n/${nest.slug}`}>Eerst het nestje bekijken</Link>
      </form>
      <p className="hint">Klopt er iets niet? <Link href={`/wachtlijst/ras/${token}`}>Wijzig je gegevens</Link>.</p>
      <Voet />
    </main>
  );
}
