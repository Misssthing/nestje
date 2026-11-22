import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/controle';
import { aantalKittens, datumNL } from '@/lib/nest';
import { createClient } from '@/lib/supabase/server';
import { adminClient, verkoperEmail } from '@/lib/wachtlijst/server';
import VerwijderKnop from './VerwijderKnop';

export const metadata: Metadata = { title: 'Nestjes zoeken', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Rij = {
  id: string;
  owner_id: string;
  slug: string;
  moeder_naam: string;
  woonplaats: string | null;
  provincie: string | null;
  geboortedatum: string;
  aangemaakt_op: string;
  afgerond: boolean;
  in_overzicht: boolean;
  controle_status: string;
  kittens: { id: string }[];
};

export default async function NestjesZoeken({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; verwijderd?: string }>;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');
  if (!isAdmin(auth.user.email)) redirect('/beheer');

  const { q = '', verwijderd } = await searchParams;
  const zoekterm = q.trim().slice(0, 60);

  let rijen: Rij[] = [];
  if (zoekterm) {
    const veilig = zoekterm.replace(/[%,()*]/g, ' ');
    const { data } = await adminClient()
      .from('nests')
      .select('id, owner_id, slug, moeder_naam, woonplaats, provincie, geboortedatum, aangemaakt_op, afgerond, in_overzicht, controle_status, kittens(id)')
      .or(`slug.ilike.*${veilig}*,moeder_naam.ilike.*${veilig}*`)
      .order('aangemaakt_op', { ascending: false })
      .limit(40)
      .returns<Rij[]>();
    rijen = data ?? [];
  }

  // E-mailadressen van de eigenaars erbij, voor herkenning (welk account het nestje heeft).
  const emails = new Map<string, string | null>();
  for (const r of rijen) {
    if (!emails.has(r.owner_id)) emails.set(r.owner_id, await verkoperEmail(r.owner_id));
  }

  return (
    <main className="wrap">
      <div className="bar">
        <Link href="/beheer" className="brand">← Je nestjes</Link>
      </div>
      <section className="hero">
        <h1>Nestjes zoeken</h1>
        <p>
          Zoek een nestje van wie dan ook, op naam van de moeder of op het stukje uit de link (de slug). Handig om een
          verdwaald test- of probleemnestje terug te vinden en te verwijderen, ook als het niet onder jouw eigen
          account staat.
        </p>
      </section>

      {verwijderd && <p className="hint" style={{ color: 'var(--free)' }}>Nestje verwijderd.</p>}

      <form method="get" className="zoekfilters" style={{ marginBottom: 22 }}>
        <label className="veld breedveld">
          <span>Zoekwoord</span>
          <input type="search" name="q" defaultValue={q} placeholder="Naam van de moeder, of de slug uit de link" maxLength={60} autoFocus />
        </label>
        <div className="filterknoppen breedveld">
          <button className="btn primary">Zoeken</button>
        </div>
      </form>

      {zoekterm && rijen.length === 0 && <p className="hint">Niets gevonden voor “{zoekterm}”.</p>}

      {rijen.length > 0 && (
        <ul className="wl-lijst">
          {rijen.map((r) => (
            <li key={r.id} className="wl-rij">
              <div className="wl-wie">
                <strong>Het nestje van {r.moeder_naam}</strong>
                <span>
                  {[
                    `geboren ${datumNL(new Date(r.geboortedatum))}`,
                    aantalKittens(r.kittens.length),
                    r.woonplaats || r.provincie ? [r.woonplaats, r.provincie].filter(Boolean).join(', ') : '',
                    r.afgerond ? 'afgerond' : '',
                    r.in_overzicht ? `in overzicht · ${r.controle_status}` : 'alleen als link',
                    emails.get(r.owner_id) ? `account: ${emails.get(r.owner_id)}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              <a className="btn ghost klein" href={`/n/${r.slug}`} target="_blank" rel="noopener noreferrer">
                Bekijk pagina ↗
              </a>
              <VerwijderKnop id={r.id} q={q} moederNaam={r.moeder_naam} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
