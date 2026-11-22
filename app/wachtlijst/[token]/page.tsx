import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Voet from '@/components/Voet';
import { eersteFoto, haalNest, type WachtRij } from '@/lib/wachtlijst/acties';
import { adminClient, isUuid } from '@/lib/wachtlijst/server';
import AanmeldFormulier from '../AanmeldFormulier';
import { afmeldenNest, reageer, wijzigNestAanmelding } from '../acties';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Je aanmelding', robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ nieuw?: string; antwoord?: string; fout?: string }>;
};

const datum = (iso: string, metTijd = false) =>
  new Date(iso).toLocaleString('nl-NL', {
    weekday: metTijd ? 'long' : undefined, day: 'numeric', month: 'long', year: metTijd ? undefined : 'numeric',
    hour: metTijd ? '2-digit' : undefined, minute: metTijd ? '2-digit' : undefined, timeZone: 'Europe/Amsterdam',
  });

export default async function MijnAanmelding({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;
  if (!isUuid(token)) notFound();
  const db = adminClient();
  const { data: rij } = await db.from('wachtlijst').select('*').eq('token', token).maybeSingle<WachtRij>();
  if (!rij) notFound();
  const nest = await haalNest(rij.nest_id);
  if (!nest) notFound();
  const { data: kitten } = rij.kitten_id
    ? await db.from('kittens').select('naam, geslacht, vacht').eq('id', rij.kitten_id).maybeSingle()
    : { data: null };

  const actief = ['wachtend', 'aangeboden', 'geaccepteerd'].includes(rij.status);
  const kittenFoto = rij.kitten_id && rij.status === 'aangeboden' ? await eersteFoto(rij.kitten_id) : null;
  const kittenLink = rij.kitten_id ? `/n/${nest.slug}#kitten-${rij.kitten_id}` : `/n/${nest.slug}`;

  return (
    <main className="wrap">
      <div className="bar">
        <Link href={`/n/${nest.slug}`} className="brand">← Het nestje van {nest.moeder_naam}</Link>
      </div>
      <section className="hero">
        <h1>Je aanmelding</h1>
        <p>
          Voor het nestje van {nest.moeder_naam}, aangemeld op {datum(rij.aangemeld_op)}.
        </p>
      </section>

      {sp.nieuw && <p className="toast-melding" role="status">Je staat op de wachtlijst. We hebben je een bevestiging gemaild.</p>}
      {sp.antwoord === 'ja' && <p className="toast-melding" role="status">Gelukt. De verkoper krijgt een mail en neemt contact met je op.</p>}
      {sp.antwoord === 'nee' && <p className="toast-melding" role="status">Je hebt nee gezegd. Je blijft op de wachtlijst staan.</p>}
      {sp.fout && <p className="fout" role="alert">{sp.fout}</p>}

      {rij.status === 'aangeboden' && kitten && (
        <section className="panel wl-aanbod">
          <h2>Er is een kitten voor je: {kitten.naam}</h2>
          {kittenFoto && (
            <Link href={kittenLink} className="wl-aanbod-foto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={kittenFoto} alt={kitten.naam} />
            </Link>
          )}
          <p>
            {kitten.geslacht === 'kater' ? 'Kater' : 'Poes'}
            {kitten.vacht ? `, ${kitten.vacht}` : ''}. Laat vóór {datum(rij.aanbod_verloopt_op!, true)} weten of je {kitten.naam} wilt.
          </p>
          <p><Link href={kittenLink}>Bekijk {kitten.naam} en de rest van het nestje →</Link></p>
          <p className="hint">Zeg je nee, dan blijf je op de wachtlijst. Kom altijd eerst kijken en betaal nooit vooruit aan iemand die je niet hebt ontmoet.</p>
          <div className="actions">
            <form action={reageer}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="antwoord" value="ja" />
              <button className="btn primary" type="submit">Ja, ik wil {kitten.naam}</button>
            </form>
            <form action={reageer}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="antwoord" value="nee" />
              <button className="btn ghost" type="submit">Nee, bedankt</button>
            </form>
          </div>
        </section>
      )}

      <section className="panel">
        <h2>Status</h2>
        <p style={{ marginBottom: 0 }}>
          {rij.status === 'wachtend' && 'Je staat op de wachtlijst. De verkoper laat het je weten als er een kitten voor je is.'}
          {rij.status === 'aangeboden' && 'Er staat een aanbod voor je klaar. Zie hierboven.'}
          {rij.status === 'geaccepteerd' && (
            <>
              {kitten?.naam ?? 'Je kitten'} is voor je gereserveerd. De verkoper neemt contact met je op.{' '}
              <Link href={kittenLink}>Bekijk het nestje</Link>.
            </>
          )}
          {rij.status === 'gesloten' && 'Dit nestje is vol. Je aanmelding is gesloten.'}
          {rij.status === 'afgemeld' && 'Je bent afgemeld voor dit nestje.'}
        </p>
        {!actief && (
          <div className="actions" style={{ marginTop: 14 }}>
            <Link className="btn primary" href="/kittens">Bekijk andere nestjes</Link>
            <Link className="btn ghost" href="/wachtlijst/ras">Mail me bij nieuwe nestjes</Link>
          </div>
        )}
      </section>

      {actief && (
        <>
          <details className="panel">
            <summary className="aanpassen">Gegevens wijzigen</summary>
            <AanmeldFormulier
              actie={wijzigNestAanmelding}
              verborgen={{ token }}
              knop="Opslaan"
              emailVast
              waarden={rij}
            />
          </details>
          {rij.status !== 'geaccepteerd' && (
            <details className="wl-afmelden">
              <summary>Afmelden voor dit nestje</summary>
              <p className="hint">Je verliest je plek op de wachtlijst. Weet je het zeker?</p>
              <form action={afmeldenNest}>
                <input type="hidden" name="token" value={token} />
                <button className="btn ghost klein" type="submit">Ja, meld me af</button>
              </form>
            </details>
          )}
        </>
      )}
      <Voet />
    </main>
  );
}
