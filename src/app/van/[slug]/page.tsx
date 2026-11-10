import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import KopieerLink from '@/components/KopieerLink';
import SocialIcoon from '@/components/SocialIcoon';
import Voet from '@/components/Voet';
import { CONFIG, fotoUrl, metUtm } from '@/lib/config';
import { aantalKittens, aftelling, dagen, rasDelen } from '@/lib/nest';
import { createPublicClient } from '@/lib/supabase/public';
import type { ProfielNest } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

const haalProfiel = cache(async (slug: string) => {
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(slug)) return null;
  const supabase = createPublicClient();
  const { data: profiel } = await supabase
    .from('openbare_profielen')
    .select('slug, naam, intro, website, facebook, instagram')
    .eq('slug', slug)
    .maybeSingle<{
      slug: string;
      naam: string;
      intro: string | null;
      website: string | null;
      facebook: string | null;
      instagram: string | null;
    }>();
  if (!profiel) return null;

  const { data: extra } = await supabase
    .from('openbare_profiel_extra')
    .select('sinds_jaar, rassen, vereniging')
    .eq('slug', slug)
    .maybeSingle<{ sinds_jaar: number | null; rassen: string | null; vereniging: string | null }>();

  const { data: nesten } = await supabase
    .from('openbare_profiel_nesten')
    .select('*')
    .eq('profiel_slug', slug)
    .eq('afgerond', false)
    .order('geboortedatum', { ascending: false })
    .returns<ProfielNest[]>();

  // Cattery: uit de nestjes van deze verkoper (ook afgeronde) met complete stamboomgegevens
  const { data: alle } = await supabase.from('openbare_profiel_nesten').select('slug').eq('profiel_slug', slug);
  const slugs = (alle ?? []).map((n: { slug: string }) => n.slug);
  const { data: stamboomNesten } = slugs.length
    ? await supabase
        .from('openbare_nesten')
        .select('cattery, stamboom_organisatie, moeder_ras, vader_ras, stamboom, geboortedatum')
        .in('slug', slugs)
        .eq('stamboom', true)
        .order('geboortedatum', { ascending: false })
    : { data: [] };
  const rijen = (stamboomNesten ?? []) as {
    cattery: string | null; stamboom_organisatie: string | null; moeder_ras: string | null; vader_ras: string | null;
  }[];
  const cattery = rijen.length
    ? {
        naam: rijen[0].cattery,
        organisatie: rijen[0].stamboom_organisatie?.replace(/ \(.*\)$/, '') ?? null,
        rassen: [...new Set(rijen.flatMap((r) => [...rasDelen(r.moeder_ras), ...rasDelen(r.vader_ras)]))],
      }
    : null;

  return { profiel, extra, cattery, nesten: nesten ?? [] };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await haalProfiel(slug);
  if (!data) return { title: 'Pagina niet gevonden', robots: { index: false } };
  const titel = `Nestjes van ${data.profiel.naam}`;
  const beschrijving = data.nesten.length
    ? `${data.nesten.length} ${data.nesten.length === 1 ? 'nestje' : 'nestjes'} kittens. Bekijk wie er nog vrij is.`
    : 'Op dit moment geen nestjes.';
  return {
    title: titel,
    description: beschrijving,
    robots: { index: false, follow: true },
    openGraph: { title: titel, description: beschrijving, type: 'website', locale: 'nl_NL', siteName: 'Nestje', url: `/van/${slug}` },
  };
}

export default async function ProfielPagina({ params }: Props) {
  const { slug } = await params;
  const data = await haalProfiel(slug);
  if (!data) notFound();
  const { profiel, extra, cattery, nesten } = data;
  const feiten = [
    extra?.sinds_jaar ? `Fokt sinds ${extra.sinds_jaar}` : '',
    extra?.rassen ?? (cattery?.rassen.length ? cattery.rassen.join(', ') : ''),
    extra?.vereniging && extra.vereniging !== 'Anders' ? `Aangesloten bij ${extra.vereniging.replace(/ \(.*\)$/, '')}` : '',
  ].filter(Boolean);

  return (
    <main className="wrap">
      <div className="bar">
        <Link href="/" className="brand">Nestje</Link>
        <KopieerLink url={`${CONFIG.siteUrl}/van/${profiel.slug}`} className="btn ghost klein" />
      </div>

      <section className="hero">
        <h1>{profiel.naam}</h1>
        {cattery && (
          <div className="cattery-kaart">
            <span className="chip verkoper">Fokker · met stamboom</span>
            <div>
              {cattery.naam && <strong>Cattery {cattery.naam}</strong>}
              {cattery.organisatie && cattery.organisatie !== 'Anders' && <span>Aangesloten bij {cattery.organisatie}</span>}
            </div>
          </div>
        )}
        {feiten.length > 0 && <p className="profiel-feiten">{feiten.join(' · ')}</p>}
        {profiel.intro && <p className="profiel-intro">{profiel.intro}</p>}
        {(profiel.website || profiel.facebook || profiel.instagram) && (
          <div className="profiel-links-blok">
            <p className="profiel-links-kop">Meer van {profiel.naam}</p>
            <div className="profiel-links">
              {profiel.facebook && (
                <a
                  href={profiel.facebook}
                  target="_blank"
                  rel="nofollow ugc noopener noreferrer"
                  aria-label={`Facebook-pagina van ${profiel.naam} (opent in een nieuw tabblad)`}
                >
                  <SocialIcoon soort="facebook" />
                  <span>Facebook</span>
                </a>
              )}
              {profiel.instagram && (
                <a
                  href={profiel.instagram}
                  target="_blank"
                  rel="nofollow ugc noopener noreferrer"
                  aria-label={`Instagram van ${profiel.naam} (opent in een nieuw tabblad)`}
                >
                  <SocialIcoon soort="instagram" />
                  <span>Instagram</span>
                </a>
              )}
              {profiel.website && (
                <a
                  href={profiel.website}
                  target="_blank"
                  rel="nofollow ugc noopener noreferrer"
                  aria-label={`Website van ${profiel.naam} (opent in een nieuw tabblad)`}
                >
                  <SocialIcoon soort="website" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {nesten.length ? (
        <div className="lijst" style={{ marginTop: 18 }}>
          {nesten.map((n) => {
            const a = aftelling(n.geboortedatum, n.verhuisleeftijd_weken);
            return (
              <Link key={n.slug} href={`/n/${n.slug}`} className="pnest">
                {n.foto ? (
                  <img className="pnest-foto" src={fotoUrl(n.foto)} alt={`Het nestje van ${n.moeder_naam}`} loading="lazy" />
                ) : (
                  <span className="pnest-foto" aria-hidden="true" />
                )}
                <div>
                  <strong>Het nestje van {n.moeder_naam}</strong>
                  <span>
                    {a.verwacht ? 'Verwacht nestje' : aantalKittens(n.kittens)}
                    {n.woonplaats ? ` in ${n.woonplaats}` : ''}
                  </span>
                  {a.verwacht ? (
                    <span className="chip optie">Verwacht over {dagen(a.dagenTotGeboorte)}</span>
                  ) : (
                    <span className={`chip ${n.vrij > 0 ? 'vrij' : 'gereserveerd'}`}>
                      {n.vrij > 0 ? `${n.vrij} vrij` : 'Geen kittens vrij'}
                      {a.wekenTeGaan > 0 ? ` · nog ${a.wekenTeGaan} wk` : ' · mag verhuizen'}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="hint" style={{ marginTop: 18 }}>Er zijn op dit moment geen nestjes. Kijk later nog eens.</p>
      )}

      <a className="gemaakt-met" href={metUtm(CONFIG.promoUrl, 'gemaakt-met-nestje', `profiel-${profiel.slug}`)}>
        <span>Ook een nestpagina voor jouw kittens?</span>
        <strong>Gemaakt met Nestje</strong>
      </a>

      <Voet />
    </main>
  );
}
