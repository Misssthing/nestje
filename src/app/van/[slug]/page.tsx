import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import KopieerLink from '@/components/KopieerLink';
import Voet from '@/components/Voet';
import { CONFIG, fotoUrl } from '@/lib/config';
import { aantalKittens, aftelling, dagen } from '@/lib/nest';
import { createPublicClient } from '@/lib/supabase/public';
import type { ProfielNest } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

const haalProfiel = cache(async (slug: string) => {
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(slug)) return null;
  const supabase = createPublicClient();
  const { data: profiel } = await supabase
    .from('openbare_profielen')
    .select('slug, naam, intro')
    .eq('slug', slug)
    .maybeSingle<{ slug: string; naam: string; intro: string | null }>();
  if (!profiel) return null;

  const { data: nesten } = await supabase
    .from('openbare_profiel_nesten')
    .select('*')
    .eq('profiel_slug', slug)
    .eq('afgerond', false)
    .order('geboortedatum', { ascending: false })
    .returns<ProfielNest[]>();

  return { profiel, nesten: nesten ?? [] };
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
  const { profiel, nesten } = data;

  return (
    <main className="wrap">
      <div className="bar">
        <Link href="/" className="brand">Nestje</Link>
        <KopieerLink url={`${CONFIG.siteUrl}/van/${profiel.slug}`} className="btn ghost klein" />
      </div>

      <section className="hero">
        <h1>{profiel.naam}</h1>
        {profiel.intro && <p className="profiel-intro">{profiel.intro}</p>}
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

      <Voet />
    </main>
  );
}
