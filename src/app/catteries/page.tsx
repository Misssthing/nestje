import type { Metadata } from 'next';
import Link from 'next/link';
import AccountKnop from '@/components/AccountKnop';
import Voet from '@/components/Voet';
import { fotoThumbUrl } from '@/lib/config';
import SlimmeFoto from '@/components/SlimmeFoto';
import { PROVINCIES, rasDelen } from '@/lib/nest';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ zoek?: string; ras?: string; provincie?: string; gecontroleerd?: string }> };

type Cattery = {
  slug: string | null; link: string; profiel: boolean; naam: string | null; intro: string | null; sinds_jaar: number | null; rassen_tekst: string | null;
  vereniging: string | null; cattery: string; organisatie: string | null; provincie: string | null; woonplaats: string | null;
  rassen: string[] | null; foto: string | null; lopend: number; lid_sinds: string | null; gecontroleerd: boolean;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { zoek, ras, provincie, gecontroleerd } = await searchParams;
  return {
    title: 'Catteries met stamboom',
    description:
      'Catteries op Nestje: fokkers met stamboom, aangesloten bij een vereniging. Bekijk hun nestjes en lees wie ze zijn.',
    alternates: { canonical: '/catteries' },
    robots: zoek || ras || provincie || gecontroleerd ? { index: false, follow: true } : { index: true, follow: true },
  };
}

/** "Cattery Mistinguett" blijft zo; "Mistinguett" wordt "Cattery Mistinguett". */
const catteryNaam = (c: string) => (/^cattery\b/i.test(c.trim()) ? c.trim() : `Cattery ${c.trim()}`);

const organisatieKort = (o: string | null) => (o && o !== 'Anders' ? o.replace(/ \(.*\)$/, '') : null);

export default async function Catteries({ searchParams }: Props) {
  const sp = await searchParams;
  const zoekterm = (sp.zoek ?? '').trim().slice(0, 60);
  const provincie = sp.provincie && (PROVINCIES as readonly string[]).includes(sp.provincie) ? sp.provincie : '';
  const rasGekozen = (sp.ras ?? '').slice(0, 60);
  const alleenGecontroleerd = sp.gecontroleerd === '1';

  const { data } = await createPublicClient()
    .from('openbare_catteries')
    .select('*')
    .order('gecontroleerd', { ascending: false })
    .order('lopend', { ascending: false })
    .order('cattery')
    .returns<Cattery[]>();
  const alle = (data ?? []).map((c) => ({
    ...c,
    rassenNetjes: [...new Set((c.rassen ?? []).flatMap((r) => rasDelen(r)))],
  }));
  const rassenKeuze = [...new Set(alle.flatMap((c) => c.rassenNetjes))].sort((a, b) => a.localeCompare(b, 'nl'));
  const zoekLower = zoekterm.toLowerCase();
  const lijst = alle.filter(
    (c) =>
      (!alleenGecontroleerd || c.gecontroleerd) &&
      (!provincie || c.provincie === provincie) &&
      (!rasGekozen || c.rassenNetjes.some((r) => r.toLowerCase() === rasGekozen.toLowerCase())) &&
      (!zoekLower ||
        catteryNaam(c.cattery).toLowerCase().includes(zoekLower) ||
        c.cattery.toLowerCase().includes(zoekLower) ||
        (c.naam ?? '').toLowerCase().includes(zoekLower) ||
        (c.woonplaats ?? '').toLowerCase().includes(zoekLower)),
  );

  return (
    <main className="wrap breed">
      <div className="bar">
        <Link href="/kittens" className="brand">← Alle kittens</Link>
        <AccountKnop />
      </div>

      <div className="cat-kop">
        <section className="hero">
          <h1>Catteries</h1>
          <p>
            Fokkers met stamboom op Nestje, aangesloten bij een vereniging. Bij “Nummers gecontroleerd” hebben we de stamboomnummers
            gecheckt op format en dubbel gebruik bij andere verkopers; bij de andere staan alleen de gegevens die de fokker zelf opgaf.
            Kom altijd eerst kijken, bij de kittens én hun moeder, en vraag naar de stamboompapieren.
          </p>
        </section>

        <form className="cat-filters panel" method="get" action="/catteries">
          <label className="veld">
            <span>Naam of woonplaats</span>
            <input type="text" name="zoek" defaultValue={zoekterm} placeholder="Bijv. Mistinguett of Capelle" maxLength={60} />
          </label>
          <label className="veld">
            <span>Ras</span>
            <select name="ras" defaultValue={rasGekozen}>
              <option value="">Alle rassen</option>
              {rassenKeuze.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="veld">
            <span>Provincie</span>
            <select name="provincie" defaultValue={provincie}>
              <option value="">Heel Nederland en België</option>
              {PROVINCIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="vink cat-vink">
            <input type="checkbox" name="gecontroleerd" value="1" defaultChecked={alleenGecontroleerd} />
            <span>Alleen met nummers gecontroleerd</span>
          </label>
          <button className="btn primary klein" type="submit">Toon</button>
        </form>
      </div>

      <p className="aantal">{lijst.length === 1 ? '1 cattery' : `${lijst.length} catteries`}</p>

      {lijst.length ? (
        <div className="cat-grid">
          {lijst.map((c) => {
            const org = organisatieKort(c.organisatie ?? c.vereniging);
            const rassen = c.rassen_tekst?.trim() || c.rassenNetjes.join(', ');
            return (
              <Link key={c.link} href={c.link} className="ckaart">
                {c.foto ? (
                  <SlimmeFoto src={fotoThumbUrl(c.foto)} alt={`Een kat van ${catteryNaam(c.cattery)}`} loading="lazy" />
                ) : (
                  <span className="ckaart-geenfoto" aria-hidden="true" />
                )}
                <span className="ckaart-tekst">
                  <span className="nkaart-label vrij">{c.lopend > 0 ? `${c.lopend} ${c.lopend === 1 ? 'nestje' : 'nestjes'} nu` : 'Geen nestje op dit moment'}</span>
                  <strong>{catteryNaam(c.cattery)}</strong>
                  {rassen && <span>{rassen}</span>}
                  <span>
                    {[c.woonplaats, c.provincie].filter(Boolean).join(', ')}
                    {c.sinds_jaar ? ` · fokt sinds ${c.sinds_jaar}` : ''}
                  </span>
                  <span className="ckaart-chips">
                    {c.gecontroleerd && <span className="chip vrij">Nummers gecontroleerd</span>}
                    {org && <span className="chip verkoper">{org}</span>}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="hint">Geen catteries gevonden met deze keuze. Probeer een andere naam, ras of provincie.</p>
      )}

      <section className="panel" style={{ marginTop: 28 }}>
        <h2>Ben je zelf fokker?</h2>
        <p className="hint" style={{ marginTop: -4, marginBottom: 12 }}>
          Maak gratis je nestjespagina. Met volledige stamboomgegevens kom je vanzelf op deze lijst. Met een profielpagina vertel je kopers ook wie je bent.
        </p>
        <Link className="btn primary" href="/verkopen">Zo werkt Nestje voor verkopers</Link>
      </section>

      <Voet />
    </main>
  );
}
