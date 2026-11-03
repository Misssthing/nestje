import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';
import { CONFIG, fotoUrl, metUtm } from '@/lib/config';
import { aantalKittens, aftelling, dagen, prijsNL, PROVINCIES, RASSEN } from '@/lib/nest';
import { createPublicClient } from '@/lib/supabase/public';
import type { OverzichtNest } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ q?: string; ras?: string; provincie?: string; soort?: string; vrij?: string; binnen4?: string }>;
};

const SOORTEN: Record<string, string> = {
  stamboom: 'Met stamboom',
  huiskat: 'Huiskat en kruising',
  vondeling: 'Vondelingen',
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, ras, provincie, soort, vrij, binnen4 } = await searchParams;
  const gefilterd = Boolean(q || ras || provincie || soort || vrij || binnen4);
  return {
    title: 'Kittens te koop',
    description:
      'Bekijk nestjes kittens van hobbyverkopers en fokkers in Nederland en België. Zie meteen welke kittens nog vrij zijn en wanneer ze mogen verhuizen.',
    alternates: { canonical: '/kittens' },
    // Gefilterde varianten niet apart in Google; de hoofdpagina wel.
    robots: gefilterd ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title: 'Kittens te koop | Nestje', type: 'website', locale: 'nl_NL', siteName: 'Nestje', url: '/kittens' },
  };
}

function rasVan(n: OverzichtNest) {
  const m = n.moeder_ras?.trim();
  const v = n.vader_ras?.trim();
  if (m && v && m.toLowerCase() !== v.toLowerCase()) return `${m} × ${v}`;
  return m || v || null;
}

export default async function Overzicht({ searchParams }: Props) {
  const sp = await searchParams;
  const { ras: rasParam, provincie: provParam, soort: soortParam } = sp;
  const zoekterm = (sp.q ?? '').replace(/[%,()*:]/g, ' ').trim().slice(0, 40);
  const alleenVrij = sp.vrij === '1';
  const binnenVier = sp.binnen4 === '1';
  const soort = soortParam && soortParam in SOORTEN ? soortParam : '';
  const ras = rasParam && rasParam.length <= 60 ? rasParam : '';
  const provincie = provParam && (PROVINCIES as readonly string[]).includes(provParam) ? provParam : '';

  const supabase = createPublicClient();
  let query = supabase.from('openbare_overzicht').select('*').order('aangemaakt_op', { ascending: false }).limit(200);
  if (provincie) query = query.eq('provincie', provincie);
  if (soort === 'stamboom') query = query.eq('stamboom', true);
  if (soort === 'huiskat') query = query.eq('soort', 'eigen').or('stamboom.is.null,stamboom.eq.false');
  if (soort === 'vondeling') query = query.eq('soort', 'vondeling');
  if (ras) {
    const veilig = ras.replace(/[%,()*]/g, '');
    query = query.or(`moeder_ras.ilike.*${veilig}*,vader_ras.ilike.*${veilig}*`);
  }
  if (zoekterm) {
    query = query.or(
      `moeder_naam.ilike.*${zoekterm}*,woonplaats.ilike.*${zoekterm}*,moeder_ras.ilike.*${zoekterm}*,vader_ras.ilike.*${zoekterm}*`,
    );
  }
  if (alleenVrij) query = query.gt('vrij', 0);
  const { data } = await query.returns<OverzichtNest[]>();
  const nesten = (data ?? []).filter((n) => {
    if (!binnenVier) return true;
    const a = aftelling(n.geboortedatum, n.verhuisleeftijd_weken);
    return !a.verwacht && a.wekenTeGaan <= 4;
  });
  const filtersActief = Boolean(zoekterm || ras || provincie || soort || alleenVrij || binnenVier);

  // Rassen voor het filter: de vaste lijst, aangevuld met wat verkopers zelf hebben ingetypt.
  const { data: rasRijen } = await supabase
    .from('openbare_overzicht')
    .select('moeder_ras, vader_ras')
    .returns<{ moeder_ras: string | null; vader_ras: string | null }[]>();
  const bekend = new Set(RASSEN.map((r) => r.toLowerCase()));
  const extra = new Map<string, string>();
  for (const rij of rasRijen ?? []) {
    for (const r of [rij.moeder_ras, rij.vader_ras]) {
      const t = r?.trim();
      if (t && !bekend.has(t.toLowerCase()) && !extra.has(t.toLowerCase())) extra.set(t.toLowerCase(), t);
    }
  }
  const rassenFilter = [...RASSEN, ...[...extra.values()].sort((a, b) => a.localeCompare(b, 'nl'))];

  // Hoeveel nestjes er per ras in het overzicht staan (zelfde logica als het filter: moeder of vader).
  const aantalPerRas = new Map<string, number>();
  for (const r of rassenFilter) {
    const zoek = r.toLowerCase();
    const n = (rasRijen ?? []).filter((rij) =>
      [rij.moeder_ras, rij.vader_ras].some((x) => x?.toLowerCase().includes(zoek)),
    ).length;
    aantalPerRas.set(r, n);
  }
  const metNestjes = rassenFilter.filter((r) => (aantalPerRas.get(r) ?? 0) > 0);
  const zonderNestjes = rassenFilter.filter((r) => (aantalPerRas.get(r) ?? 0) === 0);

  return (
    <main className="wrap breed">
      <div className="bar">
        <Link href="/kittens" className="brand">Nestje</Link>
        <Link href="/login" className="btn ghost klein">Zelf een nestje?</Link>
      </div>

      <section className="hero">
        <h1>Kittens te koop</h1>
        <p>
          Nestjes van hobbyverkopers en fokkers. Je ziet meteen welke kittens nog vrij zijn en wanneer ze mogen verhuizen.
          Kom altijd eerst kijken, bij de kittens én hun moeder.{' '}
          <a href={metUtm(CONFIG.kopenArtikelUrl, 'overzicht')}>Lees waar je op let bij het kopen van een kitten</a>.
        </p>
      </section>

      <div className="overzicht-grid">
        <aside className="filterbalk" aria-label="Zoeken en filteren">
          <form className="zoekfilters" method="get" action="/kittens">
            <h2>Zoeken</h2>
            <label className="veld breedveld">
              <span>Zoekwoord</span>
              <input type="search" name="q" defaultValue={zoekterm} placeholder="Naam, ras of woonplaats" maxLength={40} />
            </label>
            <label className="veld">
              <span>Ras</span>
              <select name="ras" defaultValue={ras}>
                <option value="">Alle rassen</option>
                {metNestjes.length > 0 && (
                  <optgroup label="Nu beschikbaar">
                    {metNestjes.map((r) => (
                      <option key={r} value={r}>{`${r} (${aantalPerRas.get(r)})`}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Andere rassen">
                  {zonderNestjes.map((r) => <option key={r} value={r}>{r}</option>)}
                </optgroup>
              </select>
            </label>
            <label className="veld">
              <span>Provincie</span>
              <select name="provincie" defaultValue={provincie}>
                <option value="">Heel Nederland en België</option>
                {PROVINCIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="veld">
              <span>Soort</span>
              <select name="soort" defaultValue={soort}>
                <option value="">Alle nestjes</option>
                {Object.entries(SOORTEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="vink breedveld">
              <input type="checkbox" name="vrij" value="1" defaultChecked={alleenVrij} />
              <span>Alleen met kittens die nog vrij zijn</span>
            </label>
            <label className="vink breedveld">
              <input type="checkbox" name="binnen4" value="1" defaultChecked={binnenVier} />
              <span>Verhuist binnen 4 weken</span>
            </label>
            <div className="filterknoppen breedveld">
              <button className="btn primary">Toon</button>
              {filtersActief && <Link href="/kittens" className="wisfilters">Wis filters</Link>}
            </div>
          </form>
        </aside>

        <div className="overzicht-lijst">
          <p className="aantal">{nesten.length === 1 ? '1 nestje' : `${nesten.length} nestjes`}</p>
      {nesten.length ? (
        <div className="lijst">
          {nesten.map((n) => {
            const a = aftelling(n.geboortedatum, n.verhuisleeftijd_weken);
            const r = rasVan(n);
            return (
              <Link key={n.slug} href={`/n/${n.slug}`} className="pnest">
                {n.foto ? (
                  <img className="pnest-foto" src={fotoUrl(n.foto)} alt={`Het nestje van ${n.moeder_naam}`} loading="lazy" />
                ) : (
                  <span className="pnest-foto" aria-hidden="true" />
                )}
                <div>
                  <strong>Het nestje van {n.moeder_naam}</strong>
                  {n.soort === 'vondeling' && <span className="chip optie" style={{ marginTop: 6 }}>Vondelingen</span>}
                  <span>
                    {a.verwacht ? 'Verwacht nestje' : aantalKittens(n.kittens)}
                    {r ? `, ${r}` : ''}
                    {n.stamboom ? ', met stamboom' : ''}
                  </span>
                  <span>
                    {[n.woonplaats, n.provincie].filter(Boolean).join(', ')}
                    {n.prijs ? ` · ${prijsNL(Number(n.prijs))}` : ''}
                  </span>
                  {a.verwacht ? (
                    <span className="chip optie">Verwacht over {dagen(a.dagenTotGeboorte)}</span>
                  ) : (
                    <span className="chip vrij">
                      {n.vrij > 0 ? `${n.vrij} vrij` : `${n.optie} onder optie`}
                      {a.wekenTeGaan > 0 ? ` · nog ${a.wekenTeGaan} wk` : ' · mag verhuizen'}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="hint">
          {filtersActief
            ? 'Geen nestjes gevonden met deze keuze. Probeer een ander filter, of wis de filters.'
            : 'Er staan nog geen nestjes in het overzicht. Kijk binnenkort nog eens.'}
        </p>
      )}


      <section className="panel" style={{ marginTop: 26 }}>
        <h2>Heb je zelf een nestje?</h2>
        <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>
          Maak gratis een pagina met al je kittens en kies of je nestje hier verschijnt.
        </p>
        <div className="actions">
          <Link className="btn primary" href="/login">Maak je nestjespagina</Link>
          <a className="btn ghost" href={metUtm(CONFIG.starterslijstUrl, 'overzicht')}>Wat heb je nodig voor een kitten?</a>
        </div>
      </section>

        </div>
      </div>

      <Voet />
    </main>
  );
}
