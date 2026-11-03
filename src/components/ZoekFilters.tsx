import Link from 'next/link';
import { PROVINCIES, RASSEN } from '@/lib/nest';
import { createPublicClient } from '@/lib/supabase/public';

export const SOORTEN: Record<string, string> = {
  stamboom: 'Met stamboom',
  huiskat: 'Huiskat en kruising',
  vondeling: 'Vondelingen',
};

type Props = {
  zoekterm?: string;
  ras?: string;
  provincie?: string;
  soort?: string;
  alleenVrij?: boolean;
  binnenVier?: boolean;
};

/** Zoek- en filterformulier voor het overzicht. Verstuurt altijd naar /kittens. */
export default async function ZoekFilters({
  zoekterm = '',
  ras = '',
  provincie = '',
  soort = '',
  alleenVrij = false,
  binnenVier = false,
}: Props) {
  const supabase = createPublicClient();
  // Rassen voor het filter: de vaste lijst, aangevuld met wat verkopers zelf hebben ingetypt.
  const { data: rasRijen } = await supabase
    .from('openbare_overzicht')
    .select('moeder_ras, vader_ras')
    .returns<{ moeder_ras: string | null; vader_ras: string | null }[]>();
  const bekend = new Set(RASSEN.map((r) => r.toLowerCase()));
  const extra = new Map<string, string>();
  for (const rij of rasRijen ?? []) {
    for (const r of [rij.moeder_ras, rij.vader_ras]) {
      const t = r?.trim();
      if (t && !bekend.has(t.toLowerCase()) && !extra.has(t.toLowerCase())) extra.set(t.toLowerCase(), t);
    }
  }
  const rassenFilter = [...RASSEN, ...[...extra.values()].sort((a, b) => a.localeCompare(b, 'nl'))];

  // Hoeveel nestjes er per ras in het overzicht staan (zelfde logica als het filter: moeder of vader).
  const aantalPerRas = new Map<string, number>();
  for (const r of rassenFilter) {
    const zoek = r.toLowerCase();
    const n = (rasRijen ?? []).filter((rij) =>
      [rij.moeder_ras, rij.vader_ras].some((x) => x?.toLowerCase().includes(zoek)),
    ).length;
    aantalPerRas.set(r, n);
  }
  const metNestjes = rassenFilter.filter((r) => (aantalPerRas.get(r) ?? 0) > 0);
  const zonderNestjes = rassenFilter.filter((r) => (aantalPerRas.get(r) ?? 0) === 0);

  const filtersActief = Boolean(zoekterm || ras || provincie || soort || alleenVrij || binnenVier);

  return (
    <form className="zoekfilters" method="get" action="/kittens">
      <h2>Zoeken</h2>
      <label className="veld breedveld">
        <span>Zoekwoord</span>
        <input type="search" name="q" defaultValue={zoekterm} placeholder="Naam, ras of woonplaats" maxLength={40} />
      </label>
      <label className="veld">
        <span>Ras</span>
        <select name="ras" defaultValue={ras}>
          <option value="">Alle rassen</option>
          {metNestjes.length > 0 && (
            <optgroup label="Nu beschikbaar">
              {metNestjes.map((r) => (
                <option key={r} value={r}>{`${r} (${aantalPerRas.get(r)})`}</option>
              ))}
            </optgroup>
          )}
          <optgroup label="Andere rassen">
            {zonderNestjes.map((r) => <option key={r} value={r}>{r}</option>)}
          </optgroup>
        </select>
      </label>
      <label className="veld">
        <span>Provincie</span>
        <select name="provincie" defaultValue={provincie}>
          <option value="">Heel Nederland en België</option>
          {PROVINCIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <label className="veld">
        <span>Soort</span>
        <select name="soort" defaultValue={soort}>
          <option value="">Alle nestjes</option>
          {Object.entries(SOORTEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label className="vink breedveld">
        <input type="checkbox" name="vrij" value="1" defaultChecked={alleenVrij} />
        <span>Alleen met kittens die nog vrij zijn</span>
      </label>
      <label className="vink breedveld">
        <input type="checkbox" name="binnen4" value="1" defaultChecked={binnenVier} />
        <span>Verhuist binnen 4 weken</span>
      </label>
      <div className="filterknoppen breedveld">
        <button className="btn primary">Toon</button>
        {filtersActief && <Link href="/kittens" className="wisfilters">Wis filters</Link>}
      </div>
    </form>
  );
}
