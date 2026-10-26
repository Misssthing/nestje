import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Aftelling from '@/components/Aftelling';
import Fotostrip from '@/components/Fotostrip';
import KopieerLink from '@/components/KopieerLink';
import Voet from '@/components/Voet';
import { CONFIG, fotoUrl, metUtm } from '@/lib/config';
import { aantalKittens, aftelling, dagen, datumNL, GEZONDHEID, ouderLabel, prijsNL, rasTekst, STATUS_PUBLIEK, STATUSSEN } from '@/lib/nest';
import { haalNestje } from './data';

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
    // Standaard niet in Google: verkopers delen hun woonplaats.
    robots: { index: false, follow: true },
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
  const ouderTest =
    nest.ouders_getest === true
      ? `Ouders getest op erfelijke aandoeningen${testInfo ? `: ${testInfo}` : ''}.`
      : nest.ouders_getest === false
        ? 'Ouders niet getest op erfelijke aandoeningen.'
        : '';
  const heeftGezondheid = kittens.some((k) => GEZONDHEID.some(([v]) => k[v]));
  const moederLabel = ouderLabel(nest.moeder_naam, nest.moeder_ras, nest.moeder_gewicht);
  const vaderLabel = ouderLabel(nest.vader_naam, nest.vader_ras, nest.vader_gewicht);
  const overMoeder =
    nest.over_moeder?.trim() ||
    `${nest.moeder_naam} is de moeder van dit nestje. Je bent welkom om de kittens en ${nest.moeder_naam} te komen bekijken voordat je beslist.`;
  const telling = STATUSSEN.map((s) => [s, kittens.filter((k) => k.status === s).length] as const).filter(
    ([, n]) => n > 0,
  );
  const paginaUrl = `${CONFIG.siteUrl}/n/${nest.slug}`;

  return (
    <main className="wrap">
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
        <KopieerLink url={paginaUrl} className="btn ghost klein" />
      </div>

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
        <h1>Het nestje van {nest.moeder_naam}</h1>
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
        {a.verwacht && nest.heeft_whatsapp && (
          <div className="interesse">
            <a className="btn primary" href={`/n/${nest.slug}/interesse`} target="_blank" rel="noopener nofollow">
              Interesse in dit nestje
            </a>
            <p className="hint">Laat de verkoper alvast weten dat je belangstelling hebt. Je opent dan WhatsApp.</p>
          </div>
        )}
      </section>

      {nest.afgerond && (
        <p className="afgerond-melding">Alle kittens van dit nestje hebben een thuis gevonden.</p>
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
          <article key={k.id} className={`kit${k.status === 'verhuisd' ? ' is-verhuisd' : ''}`}>
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
              {GEZONDHEID.some(([v]) => k[v]) && (
                <div className="health">
                  {nest.gezondheid_bij_verhuizing && <span className="health-kop">Bij verhuizing:</span>}
                  {GEZONDHEID.filter(([v]) => k[v]).map(([v, label]) => (
                    <span key={v}>✓ {label}</span>
                  ))}
                </div>
              )}
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

      {heeftGezondheid && <p className="hint" style={{ marginTop: 10 }}>{nest.gezondheid_bij_verhuizing
            ? 'De vinkjes laten zien wat geregeld is als de kittens verhuizen. Ingevuld door de verkoper.'
            : 'Gezondheidsgegevens zijn ingevuld door de verkoper.'}</p>}

      <section className="mother">
        <h2>{heeftVader ? 'De ouders' : `Over ${nest.moeder_naam}`}</h2>
        <div className={`ouders${heeftVader ? ' twee' : ''}`}>
          <div className="ouder">
            {nest.moeder_foto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoUrl(nest.moeder_foto)} alt={`Foto van moeder ${nest.moeder_naam}`} loading="lazy" />
            )}
            {(heeftVader || moederLabel !== nest.moeder_naam) && <h3>Moeder: {moederLabel}</h3>}
            <p>{overMoeder}</p>
          </div>
          {heeftVader && (
            <div className="ouder">
              {nest.vader_foto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoUrl(nest.vader_foto)} alt={`Foto van de vader${nest.vader_naam ? ` ${nest.vader_naam}` : ''}`} loading="lazy" />
              )}
              <h3>Vader{vaderLabel ? `: ${vaderLabel}` : ''}</h3>
              {nest.over_vader?.trim() && <p>{nest.over_vader.trim()}</p>}
            </div>
          )}
        </div>
        {ouderTest && <p className="ouderfeit">{ouderTest}</p>}
      </section>

      <section className="klaar">
        <h2>Klaar voor je kitten?</h2>
        <p>Van kattenbak tot krabpaal: lees wat je in huis wilt hebben voordat je kitten komt.</p>
        <a className="btn accent" href={metUtm(CONFIG.starterslijstUrl, 'starterslijst', nest.slug)}>
          Wat heb je nodig voor een kitten?
        </a>
      </section>

      <p className="hint" style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href={`/n/${nest.slug}/melden`}>Klopt er iets niet? Meld dit nestje</Link>
      </p>

      <Voet />
    </main>
  );
}
