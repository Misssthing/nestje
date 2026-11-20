'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { testSuggesties, UITSLAGEN } from '@/lib/nest';
import { MAX_PDF, UITSLAG_BUCKET, verkleinFoto, type TestMetBewijs } from '@/lib/testen';

type Props = {
  titel: string;
  ras: string;
  testen: TestMetBewijs[];
  onChange: (t: TestMetBewijs[]) => void;
  /** Bij een raskat vragen we een bewuste keuze: testen invullen, of aangeven dat die er nog niet zijn. */
  verplicht?: boolean;
  geenTesten?: boolean;
  onGeenTestenChange?: (g: boolean) => void;
  /** Nodig om een bewijs te kunnen uploaden naar de bucket "testuitslagen" (map = nest-id). */
  supabase: SupabaseClient;
  nestId: string;
  ouder: 'moeder' | 'vader';
};

/** Testen van één ouder: suggesties per ras, zelf toevoegen, met optioneel een registerlink en bewijs. */
export default function TestenLijst({
  titel, ras, testen, onChange, verplicht, geenTesten, onGeenTestenChange, supabase, nestId, ouder,
}: Props) {
  const toast = useToast();
  const [bezig, setBezig] = useState<number | null>(null);
  const aanwezig = new Set(testen.map((t) => t.test.trim().toLowerCase()));
  const suggesties = testSuggesties(ras).filter((s) => !aanwezig.has(s.toLowerCase()));

  const wijzig = (i: number, deel: Partial<TestMetBewijs>) =>
    onChange(testen.map((t, j) => (j === i ? { ...t, ...deel } : t)));
  const voegToe = (test = '') => {
    onChange([...testen, { test, uitslag: 'Negatief', datum: '' }]);
    onGeenTestenChange?.(false);
  };
  const verwijder = (i: number) => onChange(testen.filter((_, j) => j !== i));

  async function uploadBewijs(i: number, bestand: File | undefined) {
    if (!bestand) return;
    const isPdf = bestand.type === 'application/pdf';
    if (!isPdf && !bestand.type.startsWith('image/')) return toast('Alleen een foto of pdf.');
    if (isPdf && bestand.size > MAX_PDF) return toast('Dit bestand is te groot. Maximaal 5 MB.');

    setBezig(i);
    try {
      const blob = isPdf ? bestand : await verkleinFoto(bestand);
      const pad = `${nestId}/${ouder}-${crypto.randomUUID()}.${isPdf ? 'pdf' : 'jpg'}`;
      const { error } = await supabase.storage
        .from(UITSLAG_BUCKET)
        .upload(pad, blob, { contentType: isPdf ? 'application/pdf' : 'image/jpeg', upsert: false });
      if (error) throw error;
      // Alvast zo tonen alsof Nestje het nog moet bekijken; de database zet dit bij het opslaan ook echt zo.
      wijzig(i, { bewijs: pad, status: 'wacht', bekeken_op: undefined, beoordeeld: undefined });
      toast('Bewijs geüpload. We laten het je weten zodra het is bekeken.');
      // Seintje naar Nestje: er wacht een nieuwe uitslag op controle.
      fetch('/api/controle/uitslag', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nestId }),
      }).catch(() => {});
    } catch {
      toast('Uploaden lukte niet. Probeer het opnieuw.');
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
          <div className="testextra">
            <input
              aria-label="Link naar register, bijvoorbeeld PawPeds"
              type="url"
              value={t.link ?? ''}
              maxLength={200}
              placeholder="Link naar register (optioneel), bijv. pawpeds.com/…"
              onChange={(e) => wijzig(i, { link: e.target.value })}
            />
            <label className={`btn ghost klein uploadknop${bezig === i ? ' bezig' : ''}`} style={{ position: 'relative' }}>
              {bezig === i ? 'Bezig…' : t.bewijs || t.status ? 'Ander bewijs' : 'Bewijs uploaden'}
              <input
                type="file"
                accept="image/*,application/pdf"
                disabled={bezig === i}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                onChange={(e) => {
                  uploadBewijs(i, e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          {t.status === 'bekeken' && <p className="teststand bekeken">✓ Bekeken door Nestje</p>}
          {t.status === 'afgekeurd' && <p className="teststand afgekeurd">Klopte niet. Upload de uitslag opnieuw, dan kijken we nog eens.</p>}
          {t.status === 'wacht' && <p className="teststand wacht">Wacht op controle door Nestje</p>}
          {!t.bewijs && !t.status && (
            <p className="teststand">Voeg een foto of pdf van de uitslag toe (optioneel), dan krijg je het vinkje “Bekeken door Nestje”.</p>
          )}
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
      {verplicht && testen.length === 0 && (
        <label className="vink">
          <input
            type="checkbox"
            checked={Boolean(geenTesten)}
            onChange={(e) => onGeenTestenChange?.(e.target.checked)}
          />
          <span>Nog geen testen gedaan</span>
        </label>
      )}
    </div>
  );
}
