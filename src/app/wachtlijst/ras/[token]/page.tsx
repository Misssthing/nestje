import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Voet from '@/components/Voet';
import { adminClient, isUuid } from '@/lib/wachtlijst/server';
import AanmeldFormulier from '../../AanmeldFormulier';
import { afmeldenRas, bevestigOfVerlengRas, wijzigRasAanmelding } from '../../acties';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Je raslijst', robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ bevestigd?: string }> };

export default async function MijnRaslijst({ params, searchParams }: Props) {
  const { token } = await params;
  const { bevestigd } = await searchParams;
  if (!isUuid(token)) notFound();
  const { data: r } = await adminClient().from('wachtlijst_ras').select('*').eq('token', token).maybeSingle();
  if (!r) notFound();

  const tot = new Date(r.geldig_tot);
  const bijnaVerlopen = tot.getTime() - Date.now() < 31 * 864e5;
  const totTekst = tot.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' });

  return (
    <main className="wrap">
      <div className="bar">
        <Link href="/kittens" className="brand">← Alle kittens</Link>
      </div>
      <section className="hero">
        <h1>Raslijst {r.ras}</h1>
        {r.bevestigd_op ? (
          <p>Je krijgt een mail zodra er een nieuw nestje {r.ras} met stamboom op Nestje komt. Je aanmelding loopt tot {totTekst}.</p>
        ) : (
          <p>Nog één stap: bevestig dat je mails wilt krijgen over nieuwe nestjes {r.ras}.</p>
        )}
      </section>

      {bevestigd && <p className="toast-melding" role="status">Gelukt. Je staat op de raslijst {r.ras}.</p>}

      {(!r.bevestigd_op || bijnaVerlopen) && (
        <form action={bevestigOfVerlengRas} className="wl-bevestig">
          <input type="hidden" name="token" value={token} />
          <button className="btn primary" type="submit">
            {r.bevestigd_op ? 'Ik wil blijven, verleng met een jaar' : 'Bevestig mijn aanmelding'}
          </button>
        </form>
      )}

      {r.bevestigd_op && (
        <details className="panel">
          <summary className="aanpassen">Gegevens wijzigen</summary>
          <AanmeldFormulier actie={wijzigRasAanmelding} verborgen={{ token }} knop="Opslaan" emailVast waarden={r} />
        </details>
      )}

      <details className="wl-afmelden">
        <summary>Geen mails meer over {r.ras}</summary>
        <p className="hint">We verwijderen je aanmelding en je gegevens meteen.</p>
        <form action={afmeldenRas}>
          <input type="hidden" name="token" value={token} />
          <button className="btn ghost klein" type="submit">Ja, meld me af</button>
        </form>
      </details>
      <Voet />
    </main>
  );
}
