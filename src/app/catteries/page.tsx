import type { Metadata } from 'next';
import Link from 'next/link';
import AccountKnop from '@/components/AccountKnop';
import Voet from '@/components/Voet';
import { fotoUrl } from '@/lib/config';
import { PROVINCIES, rasDelen } from '@/lib/nest';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ ras?: string; provincie?: string; gecontroleerd?: string }> };

type Cattery = {
  slug: string | null; link: string; profiel: boolean; naam: string | null; intro: string | null; sinds_jaar: number | null; rassen_tekst: string | null;
  vereniging: string | null; cattery: string; organisatie: string | null; provincie: string | null; woonplaats: string | null;
  rassen: string[] | null; foto: string | null; lopend: number; lid_sinds: string | null; gecontroleerd: boolean;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { ras, provincie, gecontroleerd } = await searchParams;
  return {
    title: 'Catteries met stamboom',
    description:
      'Catteries op Nestje: fokkers met stamboom, aangesloten bij een vereniging. Bekijk hun nestjes en lees wie ze zijn.',
    alternates: { canonical: '/catteries' },
    robots: ras || provincie || gecontroleerd ? { index: false, follow: true } : { index: true, follow: true },
  };
}

/** "Cattery Mistinguett" blijft zo; "Mistinguett" wordt "Cattery Mistinguett". */
const catteryNaam = (c: string) => (/^cattery\b/i.test(c.trim()) ? c.trim() : `Cattery ${c.trim()}`);

const organisatieKort = (o: string | null) => (o && o !== 'Anders' ? o.replace(/ \(.*\)$/, '') : null);

export default async function Catteries({ searchParams }: Props) {
  const sp = await searchParams;
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
  const lijst = alle.filter(
    (c) =>
      (!alleenGecontroleerd || c.gecontroleerd) &&
      (!provincie || c.provincie === provincie) &&
      (!rasGekozen || c.rassenNetjes.some((r) => r.toLowerCase() === rasGekozen.toLowerCase())),
  );

  return (
    <main className="wrap breed">
      <div className="bar">
        <Link href="/kittens" className="brand">← Alle kittens</Link>
        <AccountKnop />
      </div>

      <section className="hero">
        <h1>Catteries</h1>
        <p>
          Fokkers met stamboom op Nestje, aangesloten bij een vereniging. Bij “Gecontroleerd” hebben we de cattery zelf
          nagekeken; bij de andere zijn de gegevens opgegeven door de fokker. Kom altijd eerst kijken, bij de kittens én hun
          moeder, en vraag naar de stamboompapieren.
        </p>
      </section>

      <form className="cat-filters" method="get" action="/catteries">
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
          <span>Alleen gecontroleerd door Nestje</span>
        </label>
        <button className="btn primary klein" type="submit">Toon</button>
      </form>

      <p className="aantal">{lijst.length === 1 ? '1 cattery' : `${lijst.length} catteries`}</p>

      {lijst.length ? (
        <div className="cat-grid">
          {lijst.map((c) => {
            const org = organisatieKort(c.organisatie ?? c.vereniging);
            const rassen = c.rassen_tekst?.trim() || c.rassenNetjes.join(', ');
            return (
              <Link key={c.link} href={c.link} className="ckaart">
                {c.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoUrl(c.foto)} alt={`Een kat van ${catteryNaam(c.cattery)}`} loading="lazy" />
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
                    {c.gecontroleerd && <span className="chip vrij">✓ Gecontroleerd</span>}
                    {org && <span className="chip verkoper">{org}</span>}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="hint">Geen catteries gevonden met deze keuze. Kies een ander ras of een andere provincie.</p>
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
