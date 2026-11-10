import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { fotoUrl } from '@/lib/config';
import { isAdmin } from '@/lib/controle';
import { aftelling, datumNL, rasTekst } from '@/lib/nest';
import { createClient } from '@/lib/supabase/server';
import { adminClient, verkoperEmail } from '@/lib/wachtlijst/server';
import { keurAf, keurGoed } from './acties';
import RedenVeld from './RedenVeld';

export const metadata: Metadata = { title: 'Controle', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Rij = {
  id: string; owner_id: string; slug: string; moeder_naam: string; woonplaats: string | null; provincie: string | null;
  geboortedatum: string; verhuisleeftijd_weken: number; moeder_foto: string | null; soort: string;
  moeder_ras: string | null; vader_ras: string | null; vader_naam: string | null; stamboom: boolean | null;
  stamboom_organisatie: string | null; cattery: string | null; moeder_stamboomnr: string | null; vader_stamboomnr: string | null;
  moeder_chip: string | null; controle_status: string; controle_reden: string | null; ter_controle_op: string | null;
  aangemaakt_op: string; prijs: number | null;
};

const SNELLE_REDENEN = [
  'Voeg een foto toe van de echte moeder, het liefst samen met haar kittens.',
  'Een rasnaam mag alleen met stamboom. Vul de stamboomgegevens in, of kies Huiskat of Kruising.',
  'De kittens verhuizen te vroeg. Volgens de huisregels is dat op zijn vroegst na 12 weken.',
  'Deze moeder heeft volgens onze gegevens te veel nestjes in korte tijd (huisregel: max. 2 per 12 maanden).',
];

export default async function Controle() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!isAdmin(user.email)) notFound();

  const db = adminClient();
  const { data } = await db
    .from('nests')
    .select('*')
    .eq('in_overzicht', true)
    .eq('afgerond', false)
    .in('controle_status', ['wacht', 'aanpassen'])
    .order('ter_controle_op', { ascending: true })
    .returns<Rij[]>();
  const rijen = data ?? [];
  const wachtend = rijen.filter((r) => r.controle_status === 'wacht');
  const afgekeurd = rijen.filter((r) => r.controle_status === 'aanpassen');

  // Extra informatie per nestje: e-mail verkoper, aantal nestjes in 12 maanden, aantal kittens, zelfde chip elders
  const jaarGeleden = new Date(Date.now() - 365 * 864e5).toISOString();
  const extra = await Promise.all(
    rijen.map(async (r) => {
      const [{ count: nestjes }, { count: kittens }, chip, email] = await Promise.all([
        db.from('nests').select('id', { count: 'exact', head: true }).eq('owner_id', r.owner_id).gte('aangemaakt_op', jaarGeleden),
        db.from('kittens').select('id', { count: 'exact', head: true }).eq('nest_id', r.id),
        r.moeder_chip
          ? db.from('nests').select('id', { count: 'exact', head: true }).eq('moeder_chip', r.moeder_chip).gte('aangemaakt_op', jaarGeleden)
          : Promise.resolve({ count: null }),
        verkoperEmail(r.owner_id),
      ]);
      return { id: r.id, nestjes: nestjes ?? 0, kittens: kittens ?? 0, chipNestjes: chip.count, email };
    }),
  );
  const info = (id: string) => extra.find((e) => e.id === id)!;

  return (
    <main className="wrap">
      <div className="bar">
        <Link href="/beheer" className="brand">← Je nestjes</Link>
      </div>
      <section className="hero">
        <h1>Controle</h1>
        <p>
          Nestjes die in het overzicht willen. Keur goed of vraag om een aanpassing; de verkoper krijgt in beide gevallen een mail.
        </p>
      </section>

      <h2 className="kop2">Wacht op controle ({wachtend.length})</h2>
      {wachtend.length === 0 && <p className="hint">Er wacht niets. Mooi zo.</p>}
      <div className="lijst">
        {wachtend.map((r) => (
          <Kaart key={r.id} r={r} i={info(r.id)} />
        ))}
      </div>

      {afgekeurd.length > 0 && (
        <details className="panel" style={{ marginTop: 28 }}>
          <summary className="aanpassen">Wacht op aanpassing door verkoper ({afgekeurd.length})</summary>
          <div className="lijst" style={{ marginTop: 12 }}>
            {afgekeurd.map((r) => (
              <Kaart key={r.id} r={r} i={info(r.id)} />
            ))}
          </div>
        </details>
      )}
    </main>
  );
}

function Kaart({ r, i }: { r: Rij; i: { nestjes: number; kittens: number; chipNestjes: number | null; email: string | null } }) {
  const a = aftelling(r.geboortedatum, r.verhuisleeftijd_weken);
  const ras = rasTekst(r.moeder_ras, r.vader_ras) || 'Geen ras ingevuld';
  const signalen = [
    r.soort !== 'vondeling' && !r.moeder_foto ? 'Geen foto van de moeder' : '',
    r.verhuisleeftijd_weken < 12 ? `Verhuisleeftijd ${r.verhuisleeftijd_weken} weken` : '',
    i.nestjes > 4 ? `${i.nestjes} nestjes in 12 maanden bij deze verkoper` : '',
    i.chipNestjes && i.chipNestjes > 2 ? `Zelfde moederchip in ${i.chipNestjes} nestjes (12 mnd)` : '',
    r.stamboom && !(r.stamboom_organisatie && r.cattery && r.moeder_stamboomnr && r.vader_stamboomnr)
      ? 'Stamboom aangevinkt, gegevens onvolledig'
      : '',
  ].filter(Boolean);

  return (
    <article className="panel ctl-kaart">
      <div className="ctl-kop">
        {r.moeder_foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl(r.moeder_foto)} alt={`Moeder ${r.moeder_naam}`} className="ctl-foto" />
        ) : (
          <span className="ctl-foto leeg">Geen moederfoto</span>
        )}
        <div>
          <h3>Het nestje van {r.moeder_naam}</h3>
          <p className="hint" style={{ margin: 0 }}>
            {r.soort === 'vondeling' ? 'Vondelingen · ' : ''}
            {ras}
            {r.stamboom ? ' · met stamboom' : ''} · {i.kittens} kittens ·{' '}
            {a.verwacht ? `verwacht ${datumNL(a.geboren)}` : `geboren ${datumNL(a.geboren)}`} · {[r.woonplaats, r.provincie].filter(Boolean).join(', ')}
          </p>
          <p className="hint" style={{ margin: '4px 0 0' }}>
            {i.email ?? 'onbekend'} · {i.nestjes} {i.nestjes === 1 ? 'nestje' : 'nestjes'} in 12 maanden
          </p>
        </div>
      </div>

      {r.stamboom && (
        <dl className="wl-gegevens ctl-stamboom">
          <dt>Organisatie</dt><dd>{r.stamboom_organisatie ?? '–'}</dd>
          <dt>Cattery</dt><dd>{r.cattery ?? '–'}</dd>
          <dt>Nr. moeder</dt><dd>{r.moeder_stamboomnr ?? '–'}</dd>
          <dt>Vader</dt><dd>{[r.vader_naam, r.vader_stamboomnr].filter(Boolean).join(', ') || '–'}</dd>
        </dl>
      )}

      {signalen.length > 0 && (
        <ul className="ctl-signalen">
          {signalen.map((s) => <li key={s}>{s}</li>)}
        </ul>
      )}
      {r.controle_status === 'aanpassen' && r.controle_reden && (
        <p className="hint">Gevraagd: {r.controle_reden}</p>
      )}

      <div className="actions">
        <a className="btn ghost klein" href={`/n/${r.slug}`} target="_blank" rel="noopener">Bekijk pagina</a>
        <form action={keurGoed}>
          <input type="hidden" name="id" value={r.id} />
          <button className="btn primary klein" type="submit">Goedkeuren</button>
        </form>
      </div>

      <details className="ctl-afkeur">
        <summary>Aanpassing vragen</summary>
        <form action={keurAf}>
          <input type="hidden" name="id" value={r.id} />
          <RedenVeld id={r.id} redenen={SNELLE_REDENEN} />
          <button className="btn ghost klein" type="submit">Verstuur naar verkoper</button>
        </form>
      </details>
    </article>
  );
}
