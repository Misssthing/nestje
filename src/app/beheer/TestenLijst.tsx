'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { testSuggesties, UITSLAGEN } from '@/lib/nest';
import { MAX_PDF, UITSLAG_BUCKET, verkleinFoto, type TestMetBewijs } from '@/lib/testen';

type Props = {
  titel: string;
  ras: string;
  testen: TestMetBewijs[];
  onChange: (t: TestMetBewijs[]) => void;
  nestId: string;
  supabase: SupabaseClient;
};

const datumKort = (d?: string) =>
  d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/** Testen van één ouder: suggesties per ras, zelf toevoegen, registerlink en de uitslag als bewijs voor Nestje. */
export default function TestenLijst({ titel, ras, testen, onChange, nestId, supabase }: Props) {
  const [bezig, setBezig] = useState<number | null>(null);
  const [fout, setFout] = useState<{ i: number; tekst: string } | null>(null);
  const aanwezig = new Set(testen.map((t) => t.test.trim().toLowerCase()));
  const suggesties = testSuggesties(ras).filter((s) => !aanwezig.has(s.toLowerCase()));

  const wijzig = (i: number, deel: Partial<TestMetBewijs>) =>
    onChange(testen.map((t, j) => (j === i ? { ...t, ...deel } : t)));

  /** Test, uitslag of datum gewijzigd: een eerdere controle geldt dan niet meer. */
  const wijzigInhoud = (i: number, deel: Partial<TestMetBewijs>) =>
    onChange(
      testen.map((t, j) => {
        if (j !== i) return t;
        const nieuw: TestMetBewijs = { ...t, ...deel };
        if (nieuw.status === 'wacht' && nieuw.bewijs) return nieuw;
        delete nieuw.status;
        delete nieuw.bekeken_op;
        delete nieuw.beoordeeld;
        delete nieuw.bewijs;
        return nieuw;
      }),
    );

  const voegToe = (test = '') => onChange([...testen, { test, uitslag: 'Negatief', datum: '' }]);

  const verwijder = (i: number) => {
    const t = testen[i];
    if (t.bewijs && t.status === 'wacht') void supabase.storage.from(UITSLAG_BUCKET).remove([t.bewijs]);
    onChange(testen.filter((_, j) => j !== i));
  };

  async function upload(i: number, bestand: File | undefined) {
    if (!bestand) return;
    setFout(null);
    const pdf = bestand.type === 'application/pdf' || /\.pdf$/i.test(bestand.name);
    if (pdf && bestand.size > MAX_PDF) return setFout({ i, tekst: 'Deze pdf is groter dan 5 MB. Maak een foto of screenshot van de uitslag.' });
    if (!pdf && !bestand.type.startsWith('image/')) return setFout({ i, tekst: 'Kies een foto of een pdf.' });
    setBezig(i);
    try {
      const inhoud: Blob = pdf ? bestand : await verkleinFoto(bestand);
      const pad = `${nestId}/${crypto.randomUUID()}.${pdf ? 'pdf' : 'jpg'}`;
      const { error } = await supabase.storage
        .from(UITSLAG_BUCKET)
        .upload(pad, inhoud, { contentType: pdf ? 'application/pdf' : 'image/jpeg' });
      if (error) throw error;
      const oud = testen[i];
      if (oud.bewijs && oud.status === 'wacht') void supabase.storage.from(UITSLAG_BUCKET).remove([oud.bewijs]);
      wijzig(i, { bewijs: pad, status: 'wacht', bekeken_op: undefined });
      // Laat Nestje weten dat er iets te bekijken is
      void fetch('/api/controle/uitslag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nestId }),
      }).catch(() => {});
    } catch {
      setFout({ i, tekst: 'Uploaden lukte niet. Probeer het opnieuw, of maak een screenshot van de uitslag.' });
    } finally {
      setBezig(null);
    }
  }

  return (
    <div className="veld testen">
      <span>{titel}</span>
      {testen.map((t, i) => (
        <div className="testblok" key={i}>
          <div className="testrij">
            <input
              aria-label="Test"
              value={t.test}
              maxLength={40}
              placeholder="Naam van de test"
              onChange={(e) => wijzigInhoud(i, { test: e.target.value })}
            />
            <select aria-label="Uitslag" value={t.uitslag} onChange={(e) => wijzigInhoud(i, { uitslag: e.target.value })}>
              {UITSLAGEN.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <input aria-label="Datum" type="date" value={t.datum} onChange={(e) => wijzigInhoud(i, { datum: e.target.value })} />
            <button type="button" className="btn ghost klein" aria-label={`${t.test || 'Test'} verwijderen`} onClick={() => verwijder(i)}>
              ✕
            </button>
          </div>

          <div className="testextra">
            <input
              aria-label={`Registerlink ${t.test}`}
              type="url"
              inputMode="url"
              value={t.link ?? ''}
              maxLength={300}
              placeholder="Link naar register, bv. PawPeds (optioneel)"
              onChange={(e) => wijzig(i, { link: e.target.value })}
            />
            <label className={`chipknop uploadknop${bezig === i ? ' bezig' : ''}`}>
              {bezig === i ? 'Bezig…' : t.bewijs && t.status === 'wacht' ? 'Andere uitslag' : '📄 Uitslag toevoegen'}
              <input
                type="file"
                accept="image/*,application/pdf"
                hidden
                disabled={bezig !== null}
                onChange={(e) => {
                  void upload(i, e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          <p className={`teststand ${t.status ?? 'opgegeven'}`}>
            {t.status === 'bekeken'
              ? `✓ Bekeken door Nestje${t.bekeken_op ? ` op ${datumKort(t.bekeken_op)}` : ''}`
              : t.status === 'wacht'
                ? 'Uitslag ontvangen, Nestje bekijkt hem (meestal binnen 24 uur)'
                : t.status === 'afgekeurd'
                  ? 'De uitslag klopte niet met wat je invulde. Pas het aan of voeg een andere uitslag toe.'
                  : 'Opgegeven door jou. Voeg de uitslag toe voor het vinkje “Bekeken door Nestje”.'}
          </p>
          {fout?.i === i && <p className="fout" role="alert">{fout.tekst}</p>}
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
      {testen.length > 0 && (
        <details className="waarom">
          <summary>Hoe werkt de uitslag en de registerlink?</summary>
          <p>
            Een foto of pdf van de uitslag zien alleen wij. We kijken of hij klopt met wat je hebt ingevuld en verwijderen het bestand
            daarna meteen. Kopers zien dan “✓ Bekeken door Nestje”. Staat de uitslag in een openbaar register, zoals PawPeds, plak dan
            de link van de pagina van je kat. Kopers kunnen het dan zelf nakijken.
          </p>
        </details>
      )}
    </div>
  );
}
