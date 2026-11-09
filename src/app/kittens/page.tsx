import type { Metadata } from 'next';
import Link from 'next/link';
import AccountKnop from '@/components/AccountKnop';
import Voet from '@/components/Voet';
import ZoekFilters, { SOORTEN } from '@/components/ZoekFilters';
import { CONFIG, fotoUrl, metUtm } from '@/lib/config';
import { aantalKittens, aftelling, dagen, maandJaarNL, prijsNL, PROVINCIES, rasDelen, VERKOPER_LABEL } from '@/lib/nest';
import { createPublicClient } from '@/lib/supabase/public';
import type { OverzichtNest } from '@/lib/types';
import { RASLIJST_RASSEN } from '@/lib/wachtlijst/rassen';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ q?: string; ras?: string; provincie?: string; soort?: string; vrij?: string; binnen4?: string }>;
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
  const delen = [...new Map([...rasDelen(n.moeder_ras), ...rasDelen(n.vader_ras)].map((r) => [r.toLowerCase(), r])).values()];
  return delen.length ? delen.join(' × ') : null;
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
  if (zoekterm) {
    query = query.or(
      `moeder_naam.ilike.*${zoekterm}*,woonplaats.ilike.*${zoekterm}*,moeder_ras.ilike.*${zoekterm}*,vader_ras.ilike.*${zoekterm}*`,
    );
  }
  if (alleenVrij) query = query.gt('vrij', 0);
  const { data } = await query.returns<OverzichtNest[]>();
  const rasGezocht = ras.toLowerCase();
  const nesten = (data ?? []).filter((n) => {
    // Ras: zelfde logica als de telling in het filter (afkortingen netjes, een kruising telt bij beide rassen).
    if (rasGezocht && ![...rasDelen(n.moeder_ras), ...rasDelen(n.vader_ras)].some((r) => r.toLowerCase() === rasGezocht))
      return false;
    if (!binnenVier) return true;
    const a = aftelling(n.geboortedatum, n.verhuisleeftijd_weken);
    return !a.verwacht && a.wekenTeGaan <= 4;
  });
  const filtersActief = Boolean(zoekterm || ras || provincie || soort || alleenVrij || binnenVier);

  return (
    <main className="wrap breed">
      <div className="bar">
        <Link href="/kittens" className="brand">Nestje</Link>
        <AccountKnop metNieuw />
      </div>


      <div className="overzicht-grid">
        <aside className="filterbalk" aria-label="Zoeken en filteren">
          <ZoekFilters
            zoekterm={zoekterm}
            ras={ras}
            provincie={provincie}
            soort={soort}
            alleenVrij={alleenVrij}
            binnenVier={binnenVier}
          />
        </aside>

        <div className="overzicht-lijst">
          <section className="hero">
            <h1>Kittens te koop</h1>
            <p>
              Nestjes van hobbyverkopers en fokkers. Je ziet meteen welke kittens nog vrij zijn en wanneer ze mogen verhuizen.
              Kom altijd eerst kijken, bij de kittens én hun moeder.{' '}
              <a href={metUtm(CONFIG.kopenArtikelUrl, 'overzicht')}>Lees waar je op let bij het kopen van een kitten</a>.
            </p>
          </section>
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
                  {n.verkoper && (
                    <span className="chip verkoper" title={n.lid_sinds ? `Lid sinds ${maandJaarNL(n.lid_sinds)}` : undefined}>
                      {VERKOPER_LABEL[n.verkoper]}
                    </span>
                  )}
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


      <section className="panel wl-raspaneel" style={{ marginTop: 26 }}>
        <h2>Niet gevonden wat je zoekt?</h2>
        <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>
          Krijg een mail zodra er een nieuw nestje met stamboom van jouw ras bij komt. Met één klik zet je je dan op de wachtlijst.
        </p>
        <Link
          className="btn primary"
          href={ras && RASLIJST_RASSEN.includes(ras) ? `/wachtlijst/ras?ras=${encodeURIComponent(ras)}` : '/wachtlijst/ras'}
        >
          {ras && RASLIJST_RASSEN.includes(ras) ? `Mail me bij een nieuw nestje ${ras}` : 'Mail me bij een nieuw nestje'}
        </Link>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
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
