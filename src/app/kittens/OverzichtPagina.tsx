import Link from 'next/link';
import AccountKnop from '@/components/AccountKnop';
import Voet from '@/components/Voet';
import ZoekFilters, { SOORTEN } from '@/components/ZoekFilters';
import { CONFIG, metUtm } from '@/lib/config';
import { aftelling, PROVINCIES, rasDelen } from '@/lib/nest';
import { naarKaart } from '@/lib/kaart';
import NestKaart from '@/components/NestKaart';
import Artikelen from '@/components/Artikelen';
import { createPublicClient } from '@/lib/supabase/public';
import type { OverzichtNest } from '@/lib/types';
import { RASLIJST_RASSEN } from '@/lib/wachtlijst/rassen';
import { RAS_ARTIKEL_URL, rasUitleg } from '@/lib/rasuitleg';
import { Suspense } from 'react';
import { OnthoudOverzicht } from '@/components/Overzichtgeheugen';
import { LANDINGS, landingVoor, type Landing } from '@/lib/landing';
import { ALGEMENE_VRAGEN, rasTekstVoor } from '@/lib/rasteksten';


export type Zoek = { q?: string; ras?: string; provincie?: string; soort?: string; vrij?: string; binnen4?: string; geslacht?: string };

/** Populaire rassen die we altijd als link tonen (voor Google en voor bezoekers). */
const RAS_LINKS = ['Huiskat', 'Europese korthaar', 'Brits korthaar', 'Brits langhaar', 'Maine Coon', 'Ragdoll', 'Noorse boskat', 'Siberische kat', 'Bengaal', 'Perzisch', 'Savannah'];


/** Het overzicht. Wordt ook gebruikt door de vaste pagina's per ras en per provincie (/kittens/maine-coon). */
export default async function OverzichtPagina({ sp, landing }: { sp: Zoek; landing?: Landing }) {
  const { ras: rasParam, provincie: provParam, soort: soortParam } = sp;
  const zoekterm = (sp.q ?? '').replace(/[%,()*:]/g, ' ').trim().slice(0, 40);
  const alleenVrij = sp.vrij === '1';
  const binnenVier = sp.binnen4 === '1';
  const geslacht = sp.geslacht === 'kater' || sp.geslacht === 'poes' ? sp.geslacht : '';
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
  // Kater of poes: alleen nestjes met een vrije kater of poes
  if (geslacht === 'kater') query = query.gt('vrij_katers', 0);
  if (geslacht === 'poes') query = query.gt('vrij_poezen', 0);
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
  const filtersActief = Boolean(zoekterm || ras || provincie || soort || alleenVrij || binnenVier || geslacht);
  const uitleg = ras ? rasUitleg(ras) : null;
  const artikel = metUtm(RAS_ARTIKEL_URL, 'ras-uitleg');
  const artikelLink = uitleg?.anker ? `${artikel}#${uitleg.anker}` : artikel;

  const rasTekst = landing?.soort === 'ras' ? rasTekstVoor(landing.naam) : null;
  const siteUrl = CONFIG.siteUrl;
  const structuur = landing
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Kittens', item: `${siteUrl}/kittens` },
            { '@type': 'ListItem', position: 2, name: landing.naam, item: `${siteUrl}/kittens/${landing.slug}` },
          ],
        },
        ...(rasTekst
          ? [
              {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: [...rasTekst.vragen, ...ALGEMENE_VRAGEN].map((q) => ({
                  '@type': 'Question',
                  name: q.v,
                  acceptedAnswer: { '@type': 'Answer', text: q.a },
                })),
              },
            ]
          : []),
      ]
    : null;

  return (
    <main className="wrap breed">
      <Suspense fallback={null}>
        <OnthoudOverzicht />
      </Suspense>
      <div className="bar">
        <span className="brand" aria-hidden="true" />
        <AccountKnop metNieuw />
      </div>

      {landing && (
        <nav className="kruimel" aria-label="Kruimelpad">
          <Link href="/kittens">Kittens</Link> <span aria-hidden="true">›</span> <span>{landing.naam}</span>
        </nav>
      )}
      <section className="kop-hero">
        <picture>
          <source media="(max-width: 700px)" srcSet="/kittens-header-800.jpg" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kittens-header.jpg" alt="" fetchPriority="high" />
        </picture>
        <div className="kop-hero-tekst">
          <h1>{landing?.kop ?? 'Kittens te koop'}</h1>
          <p>
            {landing?.intro ??
              'Vind jouw kitten bij hobbyverkopers en fokkers in Nederland en België. Je ziet meteen welke kittens nog vrij zijn en wanneer ze mogen verhuizen.'}
          </p>
          <p className="kop-hero-klein">Kom altijd eerst kijken, bij de kittens én hun moeder.</p>
        </div>
      </section>


      <div className="overzicht-grid">
        <aside className="filterbalk" aria-label="Zoeken en filteren">
          <ZoekFilters
            zoekterm={zoekterm}
            ras={ras}
            provincie={provincie}
            soort={soort}
            alleenVrij={alleenVrij}
            binnenVier={binnenVier}
            geslacht={geslacht}
          />
        </aside>

        <div className="overzicht-lijst">
          <div className="overzicht-kop">
            <p className="aantal">{nesten.length === 1 ? '1 nestje' : `${nesten.length} nestjes`}</p>
            <span className="overzicht-links">
              <Link className="overzicht-tip" href="/catteries">Alle catteries →</Link>
              {uitleg ? (
                <a className="overzicht-tip" href={artikelLink}>Waar let je op bij een raskitten? →</a>
              ) : (
                <a className="overzicht-tip" href={metUtm(CONFIG.kopenArtikelUrl, 'overzicht')}>Waar let je op bij het kopen? →</a>
              )}
            </span>
          </div>
      {uitleg && (
        <section className="ras-uitleg" aria-labelledby="ras-uitleg-kop">
          <h2 id="ras-uitleg-kop">Waarom alleen {ras}-kittens met stamboom?</h2>
          <p>{uitleg.tekst}</p>
          <div className="ras-uitleg-knoppen">
            <a className="btn primary klein" href={artikelLink}>Lees waarom dit belangrijk is →</a>
            <Link className="btn ghost klein" href={provincie ? `/kittens?provincie=${encodeURIComponent(provincie)}` : '/kittens'}>
              {provincie ? `Alle kittens in ${provincie}` : 'Alle kittens'}
            </Link>
          </div>
        </section>
      )}
      {nesten.length ? (
        <div className="kaart-grid">
          {nesten.map((n) => (
            <NestKaart key={n.slug} n={naarKaart(n)} />
          ))}
        </div>
      ) : (
        <p className="hint">
          {filtersActief
            ? 'Geen nestjes gevonden met deze keuze. Probeer een ander filter, of wis de filters.'
            : 'Er staan nog geen nestjes in het overzicht. Kijk binnenkort nog eens.'}
        </p>
      )}


      {rasTekst && (
        <section className="rastekst" aria-labelledby="rastekst-kop">
          <h2 id="rastekst-kop">{rasTekst.kop}</h2>
          {rasTekst.over.map((p) => <p key={p}>{p}</p>)}
          <h3>{rasTekst.prijsKop}</h3>
          <p>{rasTekst.prijs}</p>
          <h3>{rasTekst.vragenKop}</h3>
          <dl className="rastekst-vragen">
            {rasTekst.vragen.map((q) => (
              <div key={q.v}><dt>{q.v}</dt><dd>{q.a}</dd></div>
            ))}
          </dl>
          <h3>Veelgestelde vragen</h3>
          <dl className="rastekst-vragen">
            {ALGEMENE_VRAGEN.map((q) => (
              <div key={q.v}><dt>{q.v}</dt><dd>{q.a}</dd></div>
            ))}
          </dl>
        </section>
      )}
      {landing && (
        <script
          type="application/ld+json"
          // Voor Google: kruimelpad en veelgestelde vragen
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuur).replace(/</g, '\\u003c') }}
        />
      )}

      <section className="zoeklinks" aria-labelledby="zoeklinks-kop">
        <h2 id="zoeklinks-kop">Kittens zoeken per ras of provincie</h2>
        <h3>Per ras</h3>
        <div className="zoeklinks-rij">
          {RAS_LINKS.map((r) => landingVoor('ras', r)).filter((l): l is Landing => Boolean(l)).map((l) => (
            <Link key={l.slug} href={`/kittens/${l.slug}`} className="chipknop">{l.naam}</Link>
          ))}
        </div>
        <h3>Per provincie</h3>
        <div className="zoeklinks-rij">
          {LANDINGS.filter((l) => l.soort === 'provincie').map((l) => (
            <Link key={l.slug} href={`/kittens/${l.slug}`} className="chipknop">{l.naam}</Link>
          ))}
        </div>
      </section>

      <Artikelen titel="Over katten en kittens" plek="overzicht-artikelen" />

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
