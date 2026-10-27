import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';
import { CONFIG, fotoUrl, metUtm } from '@/lib/config';
import { aantalKittens, aftelling, dagen, prijsNL, PROVINCIES, RASSEN } from '@/lib/nest';
import { createPublicClient } from '@/lib/supabase/public';
import type { OverzichtNest } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ ras?: string; provincie?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { ras, provincie } = await searchParams;
  const gefilterd = Boolean(ras || provincie);
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
  const { ras: rasParam, provincie: provParam } = await searchParams;
  const ras = rasParam && rasParam.length <= 60 ? rasParam : '';
  const provincie = provParam && (PROVINCIES as readonly string[]).includes(provParam) ? provParam : '';

  const supabase = createPublicClient();
  let query = supabase.from('openbare_overzicht').select('*').order('aangemaakt_op', { ascending: false }).limit(200);
  if (provincie) query = query.eq('provincie', provincie);
  if (ras) {
    const veilig = ras.replace(/[%,()*]/g, '');
    query = query.or(`moeder_ras.ilike.*${veilig}*,vader_ras.ilike.*${veilig}*`);
  }
  const { data } = await query.returns<OverzichtNest[]>();
  const nesten = data ?? [];

  return (
    <main className="wrap">
      <div className="bar">
        <Link href="/kittens" className="brand">Nestje</Link>
        <Link href="/login" className="btn ghost klein">Zelf een nestje?</Link>
      </div>

      <section className="hero">
        <h1>Kittens te koop</h1>
        <p>
          Nestjes van hobbyverkopers en fokkers. Je ziet meteen welke kittens nog vrij zijn en wanneer ze mogen verhuizen.
          Kom altijd eerst kijken, bij de kittens én hun moeder.
        </p>
      </section>

      <form className="filters" method="get" action="/kittens">
        <label className="veld">
          <span>Ras</span>
          <select name="ras" defaultValue={ras}>
            <option value="">Alle rassen</option>
            {RASSEN.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="veld">
          <span>Provincie</span>
          <select name="provincie" defaultValue={provincie}>
            <option value="">Heel Nederland en België</option>
            {PROVINCIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <button className="btn primary">Toon</button>
      </form>

      {nesten.length ? (
        <div className="lijst" style={{ marginTop: 18 }}>
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
        <p className="hint" style={{ marginTop: 18 }}>
          {ras || provincie
            ? 'Geen nestjes gevonden met deze keuze. Probeer een ander ras of een andere provincie.'
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

      <Voet />
    </main>
  );
}
