import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fotoUrl } from '@/lib/config';
import { isAdmin } from '@/lib/controle';
import { aftelling, datumNL, maandJaarNL, rasTekst } from '@/lib/nest';
import { createClient } from '@/lib/supabase/server';
import { adminClient, verkoperEmail } from '@/lib/wachtlijst/server';
import { beoordeelUitslag, keurAf, keurGoed, zetCattery } from './acties';
import type { TestMetBewijs } from '@/lib/testen';
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
  'Vul de stamboomnummers van beide ouders in (alleen zichtbaar voor Nestje). Dan kunnen we je cattery controleren en krijg je het vinkje Gecontroleerd.',
  'We konden je cattery niet terugvinden. Stuur een foto van je catterycertificaat of de stamboom van de moeder naar nestje@kattenverzorging.com.',
];

/** Snelle zoeklinks om een catterynaam na te kijken. */
function zoekLinks(cattery: string, organisatie: string | null) {
  const q = encodeURIComponent(`"${cattery}"`);
  const links: [string, string][] = [
    ['Google', `https://www.google.com/search?q=${q}+cattery`],
    ['Facebook', `https://www.facebook.com/search/top?q=${encodeURIComponent(cattery)}`],
  ];
  const o = (organisatie ?? '').toLowerCase();
  if (o.includes('tica')) links.push(['TICA', `https://www.google.com/search?q=${q}+site%3Atica.org`]);
  if (o.includes('fife') || o.includes('felikat')) {
    links.push(['FIFe-register', 'https://fifeweb.org/cats/cattery-names/']);
    links.push(['Felikat', `https://www.google.com/search?q=${q}+felikat`]);
  }
  if (o.includes('wcf')) links.push(['WCF', `https://www.google.com/search?q=${q}+WCF+cattery`]);
  links.push(['PawPeds', `https://www.google.com/search?q=${q}+site%3Apawpeds.com`]);
  return links;
}

export default async function Controle() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!isAdmin(user.email)) {
    return (
      <main className="wrap">
        <div className="bar">
          <Link href="/beheer" className="brand">← Je nestjes</Link>
        </div>
        <section className="hero">
          <h1>Geen toegang tot de controle</h1>
          <p>
            Je bent ingelogd als <strong>{user.email}</strong>. Alleen het beheerdersadres kan nestjes controleren.
            Log uit en log opnieuw in met dat adres.
          </p>
        </section>
        <form action="/auth/uitloggen" method="post">
          <button className="btn primary klein">Uitloggen</button>
        </form>
      </main>
    );
  }

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

  // Stamboomnummers die ook bij een andere verkoper voorkomen
  const { data: nummers } = await db
    .from('nests')
    .select('owner_id, moeder_stamboomnr, vader_stamboomnr')
    .or('moeder_stamboomnr.not.is.null,vader_stamboomnr.not.is.null');
  const schoon = (t: string | null) => (t ?? '').replace(/\s+/g, '').toLowerCase();
  const dubbel = (r: Rij) => {
    const m = schoon(r.moeder_stamboomnr);
    const v = schoon(r.vader_stamboomnr);
    const anderen = (nummers ?? []).filter((x) => x.owner_id !== r.owner_id);
    const eigen = (nummers ?? []).filter((x) => x.owner_id === r.owner_id);
    return {
      moederElders: m ? anderen.filter((x) => schoon(x.moeder_stamboomnr) === m).length : 0,
      moederAlsVader: m ? (nummers ?? []).filter((x) => schoon(x.vader_stamboomnr) === m).length : 0,
      vaderElders: v ? anderen.filter((x) => schoon(x.vader_stamboomnr) === v).length : 0,
      vaderAlsMoeder: v ? (nummers ?? []).filter((x) => schoon(x.moeder_stamboomnr) === v).length : 0,
      eigenMoeder: m ? eigen.filter((x) => schoon(x.moeder_stamboomnr) === m).length : 0,
    };
  };
  const { data: gc } = await db.from('catteries_gecontroleerd').select('owner_id, cattery');
  const uitslagen = await haalUitslagen();
  const gecontroleerd = (r: Rij) =>
    Boolean(r.cattery && (gc ?? []).some((g) => g.owner_id === r.owner_id && g.cattery.trim().toLowerCase() === r.cattery!.trim().toLowerCase()));

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

      {uitslagen.length > 0 && (
        <section id="testuitslagen" style={{ marginBottom: 28 }}>
          <h2 className="kop2">Testuitslagen om te bekijken ({uitslagen.reduce((n, u) => n + u.testen.length, 0)})</h2>
          <p className="hint">
            Kijk of de uitslag hoort bij de juiste kat en klopt met wat de verkoper invulde. Na Klopt of Klopt niet wordt het bestand
            meteen verwijderd. Bij Klopt niet krijgt de verkoper een mail.
          </p>
          <div className="lijst">
            {uitslagen.map((u) => <UitslagKaart key={u.id} u={u} />)}
          </div>
        </section>
      )}

      <h2 className="kop2">Wacht op controle ({wachtend.length})</h2>
      {wachtend.length === 0 && <p className="hint">Er wacht niets. Mooi zo.</p>}
      <div className="lijst">
        {wachtend.map((r) => (
          <Kaart key={r.id} r={r} i={info(r.id)} gc={gecontroleerd(r)} d={dubbel(r)} />
        ))}
      </div>

      {afgekeurd.length > 0 && (
        <details className="panel" style={{ marginTop: 28 }}>
          <summary className="aanpassen">Wacht op aanpassing door verkoper ({afgekeurd.length})</summary>
          <div className="lijst" style={{ marginTop: 12 }}>
            {afgekeurd.map((r) => (
              <Kaart key={r.id} r={r} i={info(r.id)} gc={gecontroleerd(r)} d={dubbel(r)} />
            ))}
          </div>
        </details>
      )}
    </main>
  );
}

type Dubbel = { moederElders: number; moederAlsVader: number; vaderElders: number; vaderAlsMoeder: number; eigenMoeder: number };

function Kaart({ r, i, gc: gcNaam, d }: {
  r: Rij; i: { nestjes: number; kittens: number; chipNestjes: number | null; email: string | null }; gc: boolean; d: Dubbel;
}) {
  const nummers = Boolean(r.moeder_stamboomnr && r.vader_stamboomnr);
  const gc = gcNaam && nummers;
  const a = aftelling(r.geboortedatum, r.verhuisleeftijd_weken);
  const ras = rasTekst(r.moeder_ras, r.vader_ras) || 'Geen ras ingevuld';
  const compleet = Boolean(r.stamboom && r.stamboom_organisatie && r.cattery?.trim() && r.vader_naam?.trim());
  const label = r.soort === 'vondeling'
    ? 'Vondelingen'
    : compleet
      ? `Fokker · met stamboom${gc ? ' · cattery gecontroleerd' : ' (opgegeven door verkoper)'}`
      : 'Particulier, zonder stamboomlabel';
  const signalen = [
    r.soort !== 'vondeling' && !r.moeder_foto ? 'Geen foto van de moeder' : '',
    r.verhuisleeftijd_weken < 12 ? `Verhuisleeftijd ${r.verhuisleeftijd_weken} weken` : '',
    i.nestjes > 4 ? `${i.nestjes} nestjes in 12 maanden bij deze verkoper` : '',
    i.chipNestjes && i.chipNestjes > 2 ? `Zelfde moederchip in ${i.chipNestjes} nestjes (12 mnd)` : '',
    r.stamboom && !compleet ? 'Stamboom op Ja, maar organisatie, catterynaam of naam vader ontbreekt' : '',
    d.moederElders ? `Stamboomnummer moeder komt ook voor bij ${d.moederElders === 1 ? 'een andere verkoper' : `${d.moederElders} andere nestjes van andere verkopers`}` : '',
    d.moederAlsVader || d.vaderAlsMoeder ? 'Een stamboomnummer staat elders als moeder én als vader: dat kan niet kloppen' : '',
    d.eigenMoeder > 2 ? `Zelfde moeder (stamboomnummer) in ${d.eigenMoeder} nestjes van deze verkoper` : '',
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

      {r.stamboom && r.cattery?.trim() && (
        <div className="ctl-cattery">
          <div>
            <strong>Cattery {r.cattery}</strong>
            <span>
              {gc
                ? '✓ Nagekeken. Dit label geldt ook voor volgende nestjes (met stamboomnummers).'
                : gcNaam
                  ? 'Cattery eerder nagekeken, maar bij dit nestje missen de stamboomnummers, dus geen vinkje.'
                  : 'Nog niet nagekeken. Zoek de naam op:'}
            </span>
          </div>
          {!gcNaam && (
            <div className="ctl-zoek">
              {zoekLinks(r.cattery, r.stamboom_organisatie).map(([t, u]) => (
                <a key={t} href={u} target="_blank" rel="noopener noreferrer" className="chipknop">{t} ↗</a>
              ))}
            </div>
          )}
          {!nummers && !gc && (
            <span className="ctl-let-op">
              Zonder stamboomnummers van beide ouders kun je de cattery niet als gecontroleerd markeren. Vraag ze op met
              “Aanpassing vragen”, of keur goed zonder vinkje.
            </span>
          )}
          {nummers && (
            <span>
              Moeder {r.moeder_stamboomnr} · vader {r.vader_stamboomnr} ·{' '}
              <a href={`https://www.google.com/search?q=${encodeURIComponent(`"${r.moeder_stamboomnr}"`)}`} target="_blank" rel="noopener noreferrer">zoek nummer moeder ↗</a>
            </span>
          )}
          <form action={zetCattery}>
            <input type="hidden" name="owner_id" value={r.owner_id} />
            <input type="hidden" name="cattery" value={r.cattery} />
            <input type="hidden" name="aan" value={gcNaam ? '0' : '1'} />
            <button className={`btn ${gc ? 'ghost' : 'primary'} klein`} type="submit" disabled={!gc && !nummers}>
              {gcNaam ? 'Nagekeken intrekken' : '✓ Cattery nagekeken'}
            </button>
          </form>
        </div>
      )}

      <p className="ctl-label">
        Na goedkeuren in het overzicht als: <strong>{label}</strong>
        {compleet && !(r.moeder_stamboomnr && r.vader_stamboomnr) ? ' (stamboomnummers niet ingevuld, dat mag)' : ''}
      </p>

      {signalen.length > 0 && (
        <ul className="ctl-signalen">
          {signalen.map((s) => <li key={s}>{s}</li>)}
        </ul>
      )}
      {d.vaderElders > 0 && (
        <p className="hint" style={{ margin: 0 }}>
          Stamboomnummer vader komt ook voor bij {d.vaderElders === 1 ? 'een andere verkoper' : `${d.vaderElders} nestjes van andere verkopers`}.
          Dat kan kloppen als het een dekkater is.
        </p>
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

type UitslagTest = TestMetBewijs & { ouder: 'moeder' | 'vader'; url: string | null; pdf: boolean };
type Uitslagen = {
  id: string; slug: string; moeder_naam: string; vader_naam: string | null; email: string | null;
  moeder_stamboomnr: string | null; vader_stamboomnr: string | null; testen: UitslagTest[];
};

/** Nestjes met geüploade uitslagen die nog bekeken moeten worden, met een tijdelijke link naar elk bestand. */
async function haalUitslagen(): Promise<Uitslagen[]> {
  const db = adminClient();
  const wacht = [{ status: 'wacht' }];
  const kolommen = 'id, slug, owner_id, moeder_naam, vader_naam, moeder_stamboomnr, vader_stamboomnr, moeder_testen, vader_testen';
  type R = Omit<Uitslagen, 'testen' | 'email'> & { owner_id: string; moeder_testen: TestMetBewijs[] | null; vader_testen: TestMetBewijs[] | null };
  const [m, v] = await Promise.all([
    db.from('nests').select(kolommen).contains('moeder_testen', wacht).returns<R[]>(),
    db.from('nests').select(kolommen).contains('vader_testen', wacht).returns<R[]>(),
  ]);
  const rijen = [...(m.data ?? []), ...(v.data ?? [])].filter((r, i, a) => a.findIndex((x) => x.id === r.id) === i);
  return Promise.all(
    rijen.map(async (r) => {
      const open = [
        ...(r.moeder_testen ?? []).map((t) => ({ ...t, ouder: 'moeder' as const })),
        ...(r.vader_testen ?? []).map((t) => ({ ...t, ouder: 'vader' as const })),
      ].filter((t) => t.status === 'wacht' && t.bewijs);
      const testen = await Promise.all(
        open.map(async (t) => {
          const { data } = await db.storage.from('testuitslagen').createSignedUrl(t.bewijs!, 3600);
          return { ...t, url: data?.signedUrl ?? null, pdf: /\.pdf$/i.test(t.bewijs!) };
        }),
      );
      return {
        id: r.id, slug: r.slug, moeder_naam: r.moeder_naam, vader_naam: r.vader_naam,
        moeder_stamboomnr: r.moeder_stamboomnr, vader_stamboomnr: r.vader_stamboomnr,
        email: await verkoperEmail(r.owner_id), testen,
      };
    }),
  );
}

function UitslagKaart({ u }: { u: Uitslagen }) {
  return (
    <article className="panel ctl-kaart">
      <h3 style={{ margin: 0 }}>Het nestje van {u.moeder_naam}</h3>
      <p className="hint" style={{ margin: '2px 0 0' }}>
        {u.email ?? 'onbekend'} · <a href={`/n/${u.slug}`} target="_blank" rel="noopener">bekijk pagina ↗</a>
      </p>
      {u.testen.map((t) => {
        const kat = t.ouder === 'moeder' ? `Moeder ${u.moeder_naam}` : `Vader${u.vader_naam ? ` ${u.vader_naam}` : ''}`;
        const nr = t.ouder === 'moeder' ? u.moeder_stamboomnr : u.vader_stamboomnr;
        return (
          <div className="ctl-uitslag" key={t.bewijs}>
            <p className="ctl-uitslag-wat">
              <strong>{kat}</strong>{nr ? ` · ${nr}` : ''}<br />
              {t.test}: {t.uitslag.toLowerCase()}{t.datum ? ` · ${maandJaarNL(t.datum)}` : ''}
            </p>
            {t.url ? (
              t.pdf ? (
                <a className="btn ghost klein" href={t.url} target="_blank" rel="noopener noreferrer">Open pdf ↗</a>
              ) : (
                <a href={t.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.url} alt={`Uitslag ${t.test}`} className="ctl-uitslag-foto" />
                </a>
              )
            ) : (
              <p className="ctl-let-op">Bestand niet gevonden. Kies Klopt niet, dan kan de verkoper het opnieuw proberen.</p>
            )}
            {t.link && (
              <p className="hint" style={{ margin: 0 }}>
                Registerlink: <a href={t.link} target="_blank" rel="noopener noreferrer">{t.link} ↗</a>
              </p>
            )}
            <div className="actions">
              <form action={beoordeelUitslag}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="ouder" value={t.ouder} />
                <input type="hidden" name="pad" value={t.bewijs} />
                <input type="hidden" name="oordeel" value="klopt" />
                <button className="btn primary klein" type="submit">✓ Klopt</button>
              </form>
            </div>
            <details className="ctl-afkeur">
              <summary>Klopt niet</summary>
              <form action={beoordeelUitslag}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="ouder" value={t.ouder} />
                <input type="hidden" name="pad" value={t.bewijs} />
                <input type="hidden" name="oordeel" value="klopt_niet" />
                <textarea name="reden" rows={2} maxLength={500} placeholder="Wat klopte er niet? (komt in de mail aan de verkoper, mag leeg)" />
                <button className="btn ghost klein" type="submit">Klopt niet, mail verkoper</button>
              </form>
            </details>
          </div>
        );
      })}
    </article>
  );
}
