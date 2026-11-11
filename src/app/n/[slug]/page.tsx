import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Aftelling from '@/components/Aftelling';
import Fotostrip from '@/components/Fotostrip';
import KopieerLink from '@/components/KopieerLink';
import AccountKnop from '@/components/AccountKnop';
import EigenaarBalk from '@/components/EigenaarBalk';
import Voet from '@/components/Voet';
import ZoekFilters from '@/components/ZoekFilters';
import { CONFIG, fotoUrl, metUtm } from '@/lib/config';
import { aantalKittens, aftelling, dagen, datumNL, maandJaarNL, ouderLabel, verkoperVan, VERKOPER_LABEL, prijsNL, rasDelen, rasTekst, STATUS_PUBLIEK, STATUSSEN, GOEDE_UITSLAG, TEST_UITLEG } from '@/lib/nest';
import { haalNestje } from './data';
import { createPublicClient } from '@/lib/supabase/public';
import { heeftBekekenTest, registerNaam, veiligeLink, type TestMetBewijs } from '@/lib/testen';
import { ALLE_VELDEN, GEZONDHEID_NEST, VERTROUWEN_NEST, type VertrouwenVeld } from '@/lib/vertrouwen';

type Extra = Partial<Record<VertrouwenVeld, boolean>> & {
  stamboomnrs_bekend?: boolean;
  cattery_gecontroleerd?: boolean;
  verkoper?: { naam: string; slug: string; intro: string | null; sinds_jaar: number | null; rassen: string | null; vereniging: string | null } | null;
};

/** Vinkjes van het nestje en de gegevens van de verkoper (als die een profielpagina heeft). */
async function haalExtra(slug: string, profielSlug: string | null): Promise<Extra | null> {
  const db = createPublicClient();
  const [{ data: n }, p, x] = await Promise.all([
    db.from('openbare_nesten').select([...ALLE_VELDEN, 'stamboomnrs_bekend', 'cattery_gecontroleerd'].join(', ')).eq('slug', slug).maybeSingle(),
    profielSlug
      ? db.from('openbare_profielen').select('slug, naam, intro').eq('slug', profielSlug).maybeSingle()
      : Promise.resolve({ data: null }),
    profielSlug
      ? db.from('openbare_profiel_extra').select('sinds_jaar, rassen, vereniging').eq('slug', profielSlug).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const prof = p.data as { slug: string; naam: string; intro: string | null } | null;
  const ext = x.data as { sinds_jaar: number | null; rassen: string | null; vereniging: string | null } | null;
  return {
    ...((n as Extra | null) ?? {}),
    verkoper: prof ? { ...prof, sinds_jaar: ext?.sinds_jaar ?? null, rassen: ext?.rassen ?? null, vereniging: ext?.vereniging ?? null } : null,
  };
}
import { RASLIJST_RASSEN } from '@/lib/wachtlijst/rassen';
import AndereNestjes from '@/components/AndereNestjes';
import Artikelen from '@/components/Artikelen';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await haalNestje(slug);
  if (!data) return { title: 'Nestje niet gevonden', robots: { index: false } };

  const { nest, kittens } = data;
  const vrij = kittens.filter((k) => k.status === 'vrij').length;
  const a = aftelling(nest.geboortedatum, nest.verhuisleeftijd_weken);
  const titel = `Het nestje van ${nest.moeder_naam}`;
  const beschrijving = a.verwacht
    ? `De kittens worden verwacht rond ${datumNL(a.geboren)}${nest.woonplaats ? ` in ${nest.woonplaats}` : ''}. ` +
      `Nog ${dagen(a.dagenTotGeboorte)} te gaan.`
    : `${aantalKittens(kittens.length)}${nest.woonplaats ? ` in ${nest.woonplaats}` : ''}, ` +
      `${vrij} nog vrij. ` +
      (a.wekenTeGaan > 0
        ? `Over ${a.wekenTeGaan} ${a.wekenTeGaan === 1 ? 'week' : 'weken'} mogen ze verhuizen.`
        : 'Ze mogen nu verhuizen.');

  return {
    title: titel,
    description: beschrijving,
    // Alleen in Google als de verkoper zelf koos voor het openbare overzicht (en het nestje nog loopt).
    robots: data.inOverzicht ? { index: true, follow: true } : { index: false, follow: true },
    alternates: { canonical: `/n/${nest.slug}` },
    openGraph: {
      title: titel,
      description: beschrijving,
      type: 'website',
      locale: 'nl_NL',
      siteName: 'Nestje',
      url: `/n/${nest.slug}`,
    },
    twitter: { card: 'summary_large_image', title: titel, description: beschrijving },
  };
}

export default async function NestjesPagina({ params }: Props) {
  const { slug } = await params;
  const data = await haalNestje(slug);
  if (!data) notFound();

  const { nest, kittens, nestFotos, profiel, inOverzicht } = data;
  const a = aftelling(nest.geboortedatum, nest.verhuisleeftijd_weken);
  const heeftVader = Boolean(
    nest.vader_naam?.trim() || nest.over_vader?.trim() || nest.vader_ras?.trim() || nest.vader_gewicht || nest.vader_foto,
  );
  const ras = rasTekst(nest.moeder_ras, nest.vader_ras);
  const stamboom = nest.stamboom === true ? ' Met stamboom.' : nest.stamboom === false ? ' Zonder stamboom.' : '';
  const testInfo = nest.ouders_test_info?.trim();
  const vondeling = nest.soort === 'vondeling';
  const mTesten: TestMetBewijs[] = nest.moeder_testen ?? [];
  const vTesten: TestMetBewijs[] = nest.vader_testen ?? [];
  const beideGetest = heeftBekekenTest(mTesten) && heeftBekekenTest(vTesten);
  const ietsBekeken = heeftBekekenTest(mTesten) || heeftBekekenTest(vTesten);
  const gestructureerd = mTesten.length + vTesten.length > 0;
  const stamboomRegel =
    nest.stamboom === true && (nest.stamboom_organisatie || nest.cattery)
      ? `Stamboom${nest.stamboom_organisatie ? ` via ${nest.stamboom_organisatie.replace(/ \(.*\)$/, '')}` : ''}${nest.cattery ? `, cattery ${nest.cattery}` : ''}.`
      : '';
  const ouderTest = gestructureerd
    ? ''
    : nest.ouders_getest === true
      ? `Ouders getest op erfelijke aandoeningen${testInfo ? `: ${testInfo}` : ''}.`
      : nest.ouders_getest === false
        ? 'Ouders niet getest op erfelijke aandoeningen.'
        : '';
  // Gezondheid en vertrouwen per nestje, plus het blokje over de verkoper
  const extra = await haalExtra(nest.slug, profiel?.profiel_slug ?? null);
  const gezondheid = GEZONDHEID_NEST.filter(([v]) => extra?.[v]);
  const vertrouwen = VERTROUWEN_NEST.filter(([v]) => extra?.[v] && !(v === 'stamboom_papieren' && nest.stamboom !== true));
  const moederLabel = ouderLabel(nest.moeder_naam, nest.moeder_ras, nest.moeder_gewicht);
  const vaderLabel = ouderLabel(nest.vader_naam, nest.vader_ras, nest.vader_gewicht);
  const overMoeder =
    nest.over_moeder?.trim() ||
    `${nest.moeder_naam} is de moeder van dit nestje. Je bent welkom om de kittens en ${nest.moeder_naam} te komen bekijken voordat je beslist.`;
  const telling = STATUSSEN.map((s) => [s, kittens.filter((k) => k.status === s).length] as const).filter(
    ([, n]) => n > 0,
  );
  const paginaUrl = `${CONFIG.siteUrl}/n/${nest.slug}`;
  const verkoper = verkoperVan(nest);
  const organisatie = nest.stamboom_organisatie?.replace(/ \(.*\)$/, '');
  // Wachtlijst: open zolang het nestje loopt en er nog kittens vrij of onder optie zijn (of ze nog niet geboren zijn).
  const wachtlijstOpen =
    !nest.afgerond && (a.verwacht || kittens.some((k) => k.status === 'vrij' || k.status === 'optie'));
  // Tekst bij de knop hangt af van de situatie: nog niet geboren, kittens vrij, of alles onder optie.
  const vrijeKittens = kittens.filter((k) => k.status === 'vrij').length;
  // Zijn er kittens vrij en heeft de verkoper WhatsApp, dan is de knop bij elk kitten het contact.
  // De interesselijst staat dan als kleine link onder de kittens, voor wie liever niet appt.
  const whatsappPerKitten = !a.verwacht && vrijeKittens > 0 && nest.heeft_whatsapp;
  const interesse = a.verwacht
    ? { knop: 'Interesse in dit nestje', uitleg: 'Laat je gegevens achter. Je krijgt een mail als de kittens geboren zijn.' }
    : vrijeKittens > 0
      ? {
          knop: 'Ik heb interesse',
          uitleg: `Er ${vrijeKittens === 1 ? 'is nog 1 kitten' : `zijn nog ${vrijeKittens} kittens`} vrij. Laat je gegevens achter, dan kan de verkoper je een kitten aanbieden.`,
        }
      : {
          knop: 'Zet me op de wachtlijst',
          uitleg: 'Alle kittens staan onder optie. Komt er een kitten vrij, dan kan de verkoper het jou aanbieden.',
        };
  const rassenNest = [...rasDelen(nest.moeder_ras), ...rasDelen(nest.vader_ras)];
  const rasVoorLijst =
    nest.stamboom === true && rassenNest.length === 1 && RASLIJST_RASSEN.includes(rassenNest[0]) ? rassenNest[0] : null;

  return (
    <main className={inOverzicht ? 'wrap breed' : 'wrap'}>
      <div className="bar">
        {inOverzicht ? (
          <Link href="/kittens" className="brand">
            ← Alle kittens
          </Link>
        ) : (
          <Link href="/" className="brand">
            Nestje
          </Link>
        )}
        <span className="balkrechts">
          <AccountKnop />
          <KopieerLink url={paginaUrl} className="btn ghost klein" />
        </span>
      </div>
      <EigenaarBalk slug={nest.slug} />

      <div className={inOverzicht ? 'overzicht-grid' : undefined}>
        {inOverzicht && (
          <aside className="filterbalk alleen-desktop" aria-label="Zoek andere kittens">
            <ZoekFilters />
          </aside>
        )}
        <div className={inOverzicht ? 'overzicht-lijst' : undefined}>

          {nestFotos.length > 0 && (
            <div className="nestfoto">
              <Fotostrip fotos={nestFotos.map(fotoUrl)} naam={`het nestje van ${nest.moeder_naam}`} vul />
            </div>
          )}

          <section className="hero">
            {profiel && (
              <p className="van-profiel">
                Een nestje van <Link href={`/van/${profiel.profiel_slug}`}>{profiel.profiel_naam}</Link>
              </p>
            )}
            {vondeling && <span className="chip optie labelchip">Vondelingen</span>}
            <h1>Het nestje van {nest.moeder_naam}</h1>
            {verkoper && (
              <p className="verkoper-info">
                <span className="chip verkoper">{VERKOPER_LABEL[verkoper]}</span>
                {verkoper === 'fokker' && nest.cattery && (
                  <span>
                    Cattery {nest.cattery}
                    {organisatie && organisatie !== 'Anders' ? `, aangesloten bij ${organisatie}` : ''}
                  </span>
                )}
                {nest.lid_sinds && <span>Lid sinds {maandJaarNL(nest.lid_sinds)}</span>}
              </p>
            )}
            {a.verwacht ? (
              <p>
                De kittens van {nest.moeder_naam} worden verwacht rond {datumNL(a.geboren)}
                {nest.woonplaats ? ` in ${nest.woonplaats}` : ''}.{ras ? ` ${ras}.` : ''}{stamboom}
              </p>
            ) : (
              <p>
                {aantalKittens(kittens.length)}, geboren {nest.geboortedatum_geschat ? 'rond' : 'op'} {datumNL(a.geboren)}
                {nest.geboortedatum_geschat ? ' (geschat)' : ''}
                {nest.woonplaats ? ` in ${nest.woonplaats}` : ''}. Ze zijn nu {nest.geboortedatum_geschat ? 'ongeveer ' : ''}{a.leeftijdWeken}{' '}
                {a.leeftijdWeken === 1 ? 'week' : 'weken'} oud.{ras ? ` ${ras}.` : ''}{stamboom}
              </p>
            )}
            <Aftelling geboortedatum={nest.geboortedatum} weken={nest.verhuisleeftijd_weken} geschat={nest.geboortedatum_geschat} />
            {wachtlijstOpen && !whatsappPerKitten && (
              <div className="interesse">
                <Link className="btn primary" href={`/n/${nest.slug}/wachtlijst`} rel="nofollow">
                  {interesse.knop}
                </Link>
                <p className="hint">
                  {interesse.uitleg}
                  {a.verwacht && nest.heeft_whatsapp && (
                    <>
                      {' '}Liever direct contact?{' '}
                      <a href={`/n/${nest.slug}/interesse`} target="_blank" rel="noopener nofollow">Stuur een WhatsApp</a>.
                    </>
                  )}
                </p>
              </div>
            )}
          </section>

          {(nest.afgerond || (!a.verwacht && !wachtlijstOpen && kittens.length > 0)) && (
            <div className="afgerond-melding">
              <p style={{ margin: 0 }}>Alle kittens van dit nestje hebben een thuis gevonden.</p>
              {!vondeling && (
                <p className="hint" style={{ margin: '6px 0 0' }}>
                  <Link href={rasVoorLijst ? `/wachtlijst/ras?ras=${encodeURIComponent(rasVoorLijst)}` : '/kittens'}>
                    {rasVoorLijst ? `Mail me bij een nieuw nestje ${rasVoorLijst}` : 'Bekijk andere nestjes'}
                  </Link>
                </p>
              )}
            </div>
          )}

          {telling.length > 0 && (
            <div className="sum">
              {telling.map(([s, n]) => (
                <span key={s} className={`chip ${s}`}>
                  {n} {STATUS_PUBLIEK[s].toLowerCase()}
                </span>
              ))}
            </div>
          )}

          <div className="kittens">
            {kittens.map((k) => (
              <article key={k.id} id={`kitten-${k.id}`} className={`kit${k.status === 'verhuisd' ? ' is-verhuisd' : ''}`}>
                <div className="portrait">
                  <Fotostrip fotos={k.fotos.map(fotoUrl)} naam={k.naam} />
                  <span className={`chip ${k.status}`}>{STATUS_PUBLIEK[k.status]}</span>
                </div>
                <div className="kbody">
                  <h2 className="kname">{k.naam}</h2>
                  <p className="kmeta">
                    {k.geslacht === 'kater' ? 'Kater' : 'Poes'}
                    {k.vacht ? `, ${k.vacht}` : ''}
                    {nest.prijs ? ` · ${prijsNL(Number(nest.prijs))}` : ''}
                  </p>
                  {k.omschrijving && <p className="komschrijving">{k.omschrijving}</p>}
                  <div className="cta">
                    {(k.status === 'vrij' || k.status === 'optie') && nest.heeft_whatsapp ? (
                      <a
                        className="btn primary"
                        href={`/n/${nest.slug}/vraag/${k.id}`}
                        target="_blank"
                        rel="noopener nofollow"
                      >
                        Vraag naar {k.naam}
                      </a>
                    ) : (
                      <span className="btn ghost" aria-disabled="true">
                        {k.status === 'verhuisd' ? 'Al verhuisd' : STATUS_PUBLIEK[k.status]}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {wachtlijstOpen && whatsappPerKitten && (
            <p className="interesse-link">
              Liever niet via WhatsApp?{' '}
              <Link href={`/n/${nest.slug}/wachtlijst`} rel="nofollow">Laat je gegevens achter</Link>, dan neemt de verkoper contact met je op.
            </p>
          )}

          {(gezondheid.length > 0 || vertrouwen.length > 0) && (
            <section className="panel vertrouwen-blok" aria-labelledby="vertrouwen-kop">
              <h2 id="vertrouwen-kop">Gezondheid en vertrouwen</h2>
              <div className="vt-grid">
                {gezondheid.length > 0 && (
                  <div>
                    <h3>{nest.gezondheid_bij_verhuizing ? 'Geregeld bij verhuizing' : 'Gezondheid'}</h3>
                    <ul className="vt-lijst">
                      {gezondheid.map(([v, l]) => <li key={v}>{l}</li>)}
                    </ul>
                  </div>
                )}
                {vertrouwen.length > 0 && (
                  <div>
                    <h3>Kennismaken</h3>
                    <ul className="vt-lijst">
                      {vertrouwen.map(([v, l]) => <li key={v}>{l}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <p className="hint" style={{ marginBottom: 0 }}>Ingevuld door de verkoper. Vraag gerust naar het vaccinatieboekje of de papieren.</p>
            </section>
          )}

          <section className="mother">
            <h2>{heeftVader ? 'De ouders' : `Over ${nest.moeder_naam}`}</h2>
            {beideGetest && <p className="beide-getest">✓ Beide ouders getest · bekeken door Nestje</p>}
            <div className={`ouders${heeftVader ? ' twee' : ''}`}>
              <div className="ouder">
                {nest.moeder_foto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoUrl(nest.moeder_foto)} alt={`Foto van moeder ${nest.moeder_naam}`} loading="lazy" />
                )}
                {(heeftVader || moederLabel !== nest.moeder_naam) && <h3>Moeder: {moederLabel}</h3>}
                <p>{overMoeder}</p>
                <Testen testen={mTesten} />
              </div>
              {heeftVader && (
                <div className="ouder">
                  {nest.vader_foto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fotoUrl(nest.vader_foto)} alt={`Foto van de vader${nest.vader_naam ? ` ${nest.vader_naam}` : ''}`} loading="lazy" />
                  )}
                  <h3>Vader{vaderLabel ? `: ${vaderLabel}` : ''}</h3>
                  {nest.over_vader?.trim() && <p>{nest.over_vader.trim()}</p>}
                  <Testen testen={vTesten} />
                </div>
              )}
            </div>
            {ouderTest && <p className="ouderfeit">{ouderTest}</p>}
            {gestructureerd && (
              <p className="hint testhint">
                {ietsBekeken
                  ? '“Bekeken door Nestje”: wij hebben de uitslag gezien en hij klopt. “Opgegeven”: ingevuld door de verkoper, vraag gerust om de uitslag.'
                  : '“Opgegeven” betekent: ingevuld door de verkoper. Vraag gerust om de uitslagen.'}
              </p>
            )}
          </section>

          {(stamboomRegel || (extra?.verkoper && (extra.verkoper.intro || extra.verkoper.sinds_jaar || extra.verkoper.rassen))) && (
            <section className="panel verkoper-blok" aria-labelledby="verkoper-kop">
              <p className="vk-kop" id="verkoper-kop">{stamboomRegel ? 'De fokker' : 'Over de verkoper'}</p>
              <h2 className="vk-naam">
                {(() => {
                  const naam = nest.stamboom === true && nest.cattery ? `Cattery ${nest.cattery}` : extra?.verkoper?.naam ?? '';
                  return extra?.verkoper ? <Link href={`/van/${extra.verkoper.slug}`}>{naam}</Link> : naam;
                })()}
              </h2>
              {stamboomRegel && (
                <div className="vk-chips">
                  <span className="chip verkoper">Fokker · met stamboom</span>
                  {extra?.cattery_gecontroleerd ? (
                    <span className="chip vrij">✓ Gecontroleerd door Nestje</span>
                  ) : (
                    <span className="chip vk-opgegeven">Opgegeven door de verkoper</span>
                  )}
                </div>
              )}
              {extra?.verkoper?.intro && <p className="vk-intro">{extra.verkoper.intro}</p>}
              <dl className="vk-feiten">
                {organisatie && organisatie !== 'Anders' && nest.stamboom === true && (
                  <>
                    <dt>Vereniging</dt>
                    <dd>{organisatie}</dd>
                  </>
                )}
                {extra?.verkoper?.sinds_jaar && (
                  <>
                    <dt>Fokt sinds</dt>
                    <dd>{extra.verkoper.sinds_jaar}</dd>
                  </>
                )}
                {extra?.verkoper?.rassen && (
                  <>
                    <dt>Rassen</dt>
                    <dd>{extra.verkoper.rassen}</dd>
                  </>
                )}
                {stamboomRegel && (
                  <>
                    <dt>Stamboomnummers</dt>
                    <dd>{extra?.stamboomnrs_bekend ? '✓ Van beide ouders bekend bij Nestje' : 'Niet doorgegeven aan Nestje'}</dd>
                  </>
                )}
              </dl>
              {stamboomRegel && (
                <p className="hint" style={{ margin: '10px 0 0' }}>
                  Vraag bij je bezoek naar de stamboompapieren van beide ouders, en wanneer je de stamboom van je kitten krijgt.
                </p>
              )}
            </section>
          )}

          <section className="panel letop">
            <h2>Waar let je op?</h2>
            <ul>
              <li>Kom altijd eerst kijken{vondeling ? '' : ', bij de kittens én hun moeder'}.</li>
              <li>Een kitten verhuist op zijn vroegst na 12 weken, gechipt en ingeënt. Vraag naar het vaccinatieboekje.</li>
              {nest.stamboom === true && <li>Vraag naar de stamboompapieren van beide ouders, en wanneer je de stamboom van je kitten krijgt.</li>}
              <li>Betaal nooit vooruit aan iemand die je niet hebt ontmoet.</li>
            </ul>
            <p className="hint" style={{ marginBottom: 0 }}>
              Meer tips: <a href={metUtm(CONFIG.kopenArtikelUrl, 'waar-let-je-op', nest.slug)}>een kitten kopen, hier let je op</a>.
              Lees ook de <Link href="/huisregels">huisregels van Nestje</Link>.
            </p>
          </section>

          <section className="klaar">
            <h2>Klaar voor je kitten?</h2>
            <p>Van kattenbak tot krabpaal: lees wat je in huis wilt hebben voordat je kitten komt.</p>
            <a className="btn accent" href={metUtm(CONFIG.starterslijstUrl, 'starterslijst', nest.slug)}>
              Wat heb je nodig voor een kitten?
            </a>
          </section>

          {/* Andere nestjes alleen als de verkoper zelf in het openbare overzicht staat */}
          {inOverzicht && <AndereNestjes slug={nest.slug} moederRas={nest.moeder_ras} vaderRas={nest.vader_ras} />}
          <Artikelen trefwoorden={rassenNest} plek="nestje-artikelen" slug={nest.slug} />

          <p className="hint" style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href={`/n/${nest.slug}/melden`}>Klopt er iets niet? Meld dit nestje</Link>
          </p>

          <a className="gemaakt-met" href={metUtm(CONFIG.promoUrl, 'gemaakt-met-nestje', nest.slug)}>
            <span>Ook een nestpagina voor jouw kittens?</span>
            <strong>Gemaakt met Nestje</strong>
          </a>
        </div>
      </div>

      <Voet />
    </main>
  );
}

function Testen({ testen }: { testen: TestMetBewijs[] }) {
  if (!testen.length) return null;
  return (
    <div className="testkaart">
      <p className="testkaart-kop">Gezondheidstesten</p>
      <ul className="oudertesten">
        {testen.map((t) => {
          const goed = GOEDE_UITSLAG.includes(t.uitslag);
          const uitleg = TEST_UITLEG[t.test];
          const link = veiligeLink(t.link);
          const bekeken = t.status === 'bekeken';
          const datum = t.datum
            ? new Date(`${t.datum}T12:00:00`).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })
            : '';
          return (
            <li key={`${t.test}-${t.datum}`}>
              <div className="test-info">
                <span className="t">
                  {t.test} <span className={`uitslag${goed ? ' goed' : ''}`}>{t.uitslag.toLowerCase()}</span>
                </span>
                {(uitleg || datum) && <span className="u">{[uitleg, datum && `getest ${datum}`].filter(Boolean).join(' · ')}</span>}
              </div>
              <div className="testlabels">
                <span className={`testlabel${bekeken ? ' bekeken' : ''}`}>{bekeken ? '✓ Bekeken door Nestje' : 'Opgegeven'}</span>
                {link && (
                  <a className="testlabel link" href={link} target="_blank" rel="noopener noreferrer nofollow">
                    Bekijk in {registerNaam(link)} ↗
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
