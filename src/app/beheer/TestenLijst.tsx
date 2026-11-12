'use client';

import { testSuggesties, UITSLAGEN, type OuderTest } from '@/lib/nest';

type Props = {
  titel: string;
  ras: string;
  testen: OuderTest[];
  onChange: (t: OuderTest[]) => void;
};

/** Testen van één ouder: suggesties per ras, plus zelf toevoegen. */
export default function TestenLijst({ titel, ras, testen, onChange }: Props) {
  const aanwezig = new Set(testen.map((t) => t.test.trim().toLowerCase()));
  const suggesties = testSuggesties(ras).filter((s) => !aanwezig.has(s.toLowerCase()));

  const wijzig = (i: number, deel: Partial<OuderTest>) =>
    onChange(testen.map((t, j) => (j === i ? { ...t, ...deel } : t)));
  const voegToe = (test = '') => onChange([...testen, { test, uitslag: 'Negatief', datum: '' }]);
  const verwijder = (i: number) => onChange(testen.filter((_, j) => j !== i));

  return (
    <div className="veld testen">
      <span>{titel}</span>
      {testen.map((t, i) => (
        <div className="testrij" key={i}>
          <input
            aria-label="Test"
            value={t.test}
            maxLength={40}
            placeholder="Naam van de test"
            onChange={(e) => wijzig(i, { test: e.target.value })}
          />
          <select aria-label="Uitslag" value={t.uitslag} onChange={(e) => wijzig(i, { uitslag: e.target.value })}>
            {UITSLAGEN.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <input aria-label="Datum" type="date" value={t.datum} onChange={(e) => wijzig(i, { datum: e.target.value })} />
          <button type="button" className="btn ghost klein" aria-label={`${t.test || 'Test'} verwijderen`} onClick={() => verwijder(i)}>
            ✕
          </button>
        </div>
      ))}
      <div className="testsuggesties">
        {suggesties.map((s) => (
          <button type="button" key={s} className="chipknop" onClick={() => voegToe(s)}>
            + {s}
          </button>
        ))}
        <button type="button" className="chipknop" onClick={() => voegToe()}>+ Andere test</button>
      </div>
      {ras.trim() === '' && <p className="hint">Vul het ras in, dan zie je de testen die bij dat ras gebruikelijk zijn.</p>}
    </div>
  );
}
