'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { PROVINCIES } from '@/lib/nest';
import type { Nest } from '@/lib/types';

type Props = { nest: Nest; supabase: SupabaseClient; onNest: (patch: Partial<Nest>) => void };

/** Aan of uit in het openbare overzicht, met de provincie. Staat bovenaan het beheer, zodat je het niet hoeft te zoeken. */
export default function Zichtbaarheid({ nest, supabase, onNest }: Props) {
  const toast = useToast();
  const [provincie, setProvincie] = useState(nest.provincie ?? '');
  const [fout, setFout] = useState('');

  async function bewaar(patch: Partial<Nest>, melding: string) {
    setFout('');
    const { error } = await supabase.from('nests').update(patch).eq('id', nest.id);
    if (error) return setFout('Opslaan lukte niet. Probeer het opnieuw.');
    onNest(patch);
    toast(melding);
  }

  function zetAan(aan: boolean) {
    if (aan === nest.in_overzicht) return;
    if (aan && !provincie) return setFout('Kies eerst je provincie, dan kunnen kopers in de buurt je vinden.');
    void bewaar({ in_overzicht: aan, provincie: provincie || null }, aan ? 'Aangemeld voor het overzicht' : 'Uit het overzicht gehaald');
  }

  return (
    <section className="panel zichtbaar" id="sectie-overzicht" aria-labelledby="zb-kop">
      <h2 id="zb-kop">Gevonden worden op Nestje</h2>
      <p className="hint" style={{ marginTop: -4 }}>
        Zet je nestje in het overzicht op nestje.kattenverzorging.com/kittens. Je nummer staat er niet op. Voordat het verschijnt,
        bekijken we je nestje eerst, meestal binnen 24 uur.
      </p>
      <div className="row stapel">
        <div className="veld">
          <span>In het overzicht</span>
          <div className="seg" role="group" aria-label="In het overzicht">
            <button type="button" aria-pressed={!nest.in_overzicht} onClick={() => zetAan(false)}>Uit</button>
            <button type="button" aria-pressed={nest.in_overzicht} onClick={() => zetAan(true)}>Aan</button>
          </div>
        </div>
        <label className="veld">
          <span>Provincie</span>
          <select
            value={provincie}
            onChange={(e) => {
              setProvincie(e.target.value);
              if (e.target.value) void bewaar({ provincie: e.target.value }, 'Provincie opgeslagen');
            }}
          >
            <option value="">Kies…</option>
            {PROVINCIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>
      {fout && <p className="fout" role="alert">{fout}</p>}
    </section>
  );
}
