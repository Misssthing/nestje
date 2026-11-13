import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Voet from '@/components/Voet';
import type { NieuwsbriefRij } from '@/lib/nieuwsbrief';
import { adminClient, isUuid } from '@/lib/wachtlijst/server';
import { afmelden, bevestig } from '../acties';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Nieuwsbrief', robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ bevestigd?: string; afgemeld?: string }> };

export default async function Nieuwsbrief({ params, searchParams }: Props) {
  const { token } = await params;
  const sp = await searchParams;
  if (!isUuid(token)) notFound();
  const { data: r } = await adminClient()
    .from('nieuwsbrief').select('*').eq('token', token).maybeSingle<NieuwsbriefRij>();
  if (!r) notFound();

  const actief = Boolean(r.bevestigd_op && !r.afgemeld_op);

  return (
    <main className="wrap">
      <div className="bar">
        <Link href="/kittens" className="brand">← Alle kittens</Link>
      </div>
      <section className="hero">
        <h1>Nestje-nieuwsbrief</h1>
        {actief ? (
          <p>Je bent aangemeld. Je ontvangt de nieuwsbrief op {r.email}, met tips om je kitten een goede start te geven.</p>
        ) : r.afgemeld_op ? (
          <p>Je bent afgemeld. Je ontvangt geen nieuwsbrief meer op {r.email}.</p>
        ) : (
          <p>Nog één stap: bevestig dat je de nieuwsbrief wilt ontvangen op {r.email}.</p>
        )}
      </section>

      {sp.bevestigd && actief && <p className="toast-melding" role="status">Gelukt. Je bent aangemeld voor de nieuwsbrief.</p>}
      {sp.afgemeld && <p className="toast-melding" role="status">Je bent afgemeld.</p>}

      {!actief && (
        <form action={bevestig} className="wl-bevestig">
          <input type="hidden" name="token" value={token} />
          <button className="btn primary" type="submit">
            {r.afgemeld_op ? 'Toch weer aanmelden' : 'Ja, stuur mij de nieuwsbrief'}
          </button>
        </form>
      )}

      {actief && (
        <details className="wl-afmelden">
          <summary>Geen nieuwsbrief meer</summary>
          <form action={afmelden}>
            <input type="hidden" name="token" value={token} />
            <button className="btn ghost klein" type="submit">Afmelden</button>
          </form>
        </details>
      )}

      <p className="hint">
        Je aanmelding voor een wachtlijst staat hier los van. <Link href="/privacy">Privacyverklaring</Link>
      </p>
      <Voet />
    </main>
  );
}
