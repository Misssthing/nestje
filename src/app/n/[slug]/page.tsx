import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Aftelling from '@/components/Aftelling';
import Fotostrip from '@/components/Fotostrip';
import KopieerLink from '@/components/KopieerLink';
import Voet from '@/components/Voet';
import { CONFIG, fotoUrl } from '@/lib/config';
import { aantalKittens, aftelling, datumNL, prijsNL, STATUS_LABEL, STATUSSEN } from '@/lib/nest';
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
  const beschrijving =
    `${aantalKittens(kittens.length)}${nest.woonplaats ? ` in ${nest.woonplaats}` : ''}, ` +
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

  const { nest, kittens, nestFotos } = data;
  const a = aftelling(nest.geboortedatum, nest.verhuisleeftijd_weken);
  const heeftVader = Boolean(nest.vader_naam?.trim() || nest.over_vader?.trim());
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
        <Link href="/" className="brand">
          Nestje
        </Link>
        <KopieerLink url={paginaUrl} className="btn ghost klein" />
      </div>

      {nestFotos.length > 0 && (
        <div className="nestfoto">
          <Fotostrip fotos={nestFotos.map(fotoUrl)} naam={`het nestje van ${nest.moeder_naam}`} />
        </div>
      )}

      <section className="hero">
        <h1>Het nestje van {nest.moeder_naam}</h1>
        <p>
          {aantalKittens(kittens.length)}, geboren op {datumNL(a.geboren)}
          {nest.woonplaats ? ` in ${nest.woonplaats}` : ''}. Ze zijn nu {a.leeftijdWeken}{' '}
          {a.leeftijdWeken === 1 ? 'week' : 'weken'} oud.
        </p>
        <Aftelling geboortedatum={nest.geboortedatum} weken={nest.verhuisleeftijd_weken} />
      </section>

      {telling.length > 0 && (
        <div className="sum">
          {telling.map(([s, n]) => (
            <span key={s} className={`chip ${s}`}>
              {n} {STATUS_LABEL[s].toLowerCase()}
            </span>
          ))}
        </div>
      )}

      <div className="kittens">
        {kittens.map((k) => (
          <article key={k.id} className={`kit${k.status === 'verhuisd' ? ' is-verhuisd' : ''}`}>
            <div className="portrait">
              <Fotostrip fotos={k.fotos.map(fotoUrl)} naam={k.naam} />
              <span className={`chip ${k.status}`}>{STATUS_LABEL[k.status]}</span>
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
                {k.status === 'vrij' && nest.heeft_whatsapp ? (
                  <a
                    className="btn primary"
                    href={`/n/${nest.slug}/vraag/${k.id}`}
                    target="_blank"
                    rel="noopener nofollow"
                  >
                    Vraag naar {k.naam}
                  </a>
                ) : k.status === 'vrij' ? (
                  <span className="btn ghost" aria-disabled="true">
                    Vrij
                  </span>
                ) : (
                  <span className="btn ghost" aria-disabled="true">
                    {k.status === 'gereserveerd' ? 'Gereserveerd' : 'Al verhuisd'}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="mother">
        {heeftVader ? (
          <>
            <h2>De ouders</h2>
            <h3>Moeder: {nest.moeder_naam}</h3>
            <p>{overMoeder}</p>
            <h3>Vader{nest.vader_naam?.trim() ? `: ${nest.vader_naam.trim()}` : ''}</h3>
            {nest.over_vader?.trim() && <p>{nest.over_vader.trim()}</p>}
          </>
        ) : (
          <>
            <h2>Over {nest.moeder_naam}</h2>
            <p>{overMoeder}</p>
          </>
        )}
      </section>

      <section className="klaar">
        <h2>Klaar voor je kitten?</h2>
        <p>Van kattenbak tot krabpaal: de starterslijst laat zien wat je in huis wilt hebben voordat je kitten komt.</p>
        <a className="btn accent" href={CONFIG.starterslijstUrl}>
          Bekijk de starterslijst
        </a>
      </section>

      <Voet />
    </main>
  );
}
