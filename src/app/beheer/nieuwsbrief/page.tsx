import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/controle';
import { brevoGekoppeld, type NieuwsbriefRij } from '@/lib/nieuwsbrief';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/wachtlijst/server';
import { stuurNaarBrevo } from './acties';

export const metadata: Metadata = { title: 'Nieuwsbrief', robots: { index: false } };
export const dynamic = 'force-dynamic';

const datum = (iso: string) =>
  new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' });

export default async function NieuwsbriefBeheer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!isAdmin(user.email)) redirect('/beheer');

  const { data } = await adminClient()
    .from('nieuwsbrief').select('*').order('aangevraagd_op', { ascending: false }).returns<NieuwsbriefRij[]>();
  const alle = data ?? [];
  const actief = alle.filter((r) => r.bevestigd_op && !r.afgemeld_op);
  const wacht = alle.filter((r) => !r.bevestigd_op && !r.afgemeld_op);
  const afgemeld = alle.filter((r) => r.afgemeld_op);
  const nietInBrevo = actief.filter((r) => !r.in_brevo_op).length;
  const gekoppeld = brevoGekoppeld();

  return (
    <main className="wrap">
      <div className="bar">
        <Link href="/beheer" className="brand">← Je nestjes</Link>
      </div>
      <section className="hero">
        <h1>Nieuwsbrief</h1>
        <p>
          {actief.length} {actief.length === 1 ? 'aanmelding' : 'aanmeldingen'} bevestigd, {wacht.length} wacht
          {wacht.length === 1 ? '' : 'en'} op bevestiging, {afgemeld.length} afgemeld.
        </p>
      </section>

      <div className="panel">
        <p style={{ marginTop: 0 }}>
          {gekoppeld
            ? nietInBrevo
              ? `Brevo is gekoppeld. ${nietInBrevo} bevestigd${nietInBrevo === 1 ? ' adres staat' : 'e adressen staan'} nog niet in Brevo.`
              : 'Brevo is gekoppeld. Nieuwe bevestigde aanmeldingen komen vanzelf in je Brevo-lijst.'
            : 'Brevo is nog niet gekoppeld. Download de lijst en importeer hem in Brevo, of stel BREVO_NIEUWSBRIEF_LIJST in bij Vercel.'}
        </p>
        <div className="actions">
          <a className="btn primary" href="/api/nieuwsbrief/export">Download CSV voor Brevo</a>
          {gekoppeld && nietInBrevo > 0 && (
            <form action={stuurNaarBrevo}>
              <button className="btn ghost" type="submit">Zet ontbrekende in Brevo</button>
            </form>
          )}
        </div>
      </div>

      <h2 style={{ marginTop: 28 }}>Bevestigd</h2>
      {actief.length ? (
        <ul className="wl-lijst">
          {actief.map((r) => (
            <li key={r.id} className="wl-rij">
              <div className="wl-wie">
                <strong>{r.email}</strong>
                <span>
                  {[r.naam, r.bron === 'raslijst' ? 'via raslijst' : 'via wachtlijst nestje', `bevestigd ${datum(r.bevestigd_op!)}`, r.in_brevo_op ? 'in Brevo' : '']
                    .filter(Boolean).join(', ')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">Nog niemand. Aanmeldingen komen binnen via het vinkje bij de wachtlijsten.</p>
      )}

      {wacht.length > 0 && (
        <>
          <h2 style={{ marginTop: 28 }}>Wacht op bevestiging</h2>
          <p className="hint">Deze mensen hebben het vinkje aangezet maar nog niet op de knop in de mail gedrukt. Stuur hen nog geen nieuwsbrief.</p>
          <ul className="wl-lijst">
            {wacht.map((r) => (
              <li key={r.id} className="wl-rij is-gesloten">
                <div className="wl-wie">
                  <strong>{r.email}</strong>
                  <span>aangevraagd {datum(r.aangevraagd_op)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
