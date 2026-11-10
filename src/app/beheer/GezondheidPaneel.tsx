'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useToast } from '@/components/Toast';
import type { Nest } from '@/lib/types';
import { GEZONDHEID_NEST, VERTROUWEN_NEST, type VertrouwenVeld } from '@/lib/vertrouwen';

type Props = { nest: Nest; supabase: SupabaseClient; onNest: (patch: Partial<Nest>) => void };

/** Gezondheid en vertrouwen voor het hele nestje. Elk vinkje wordt direct opgeslagen. */
export default function GezondheidPaneel({ nest, supabase, onNest }: Props) {
  const toast = useToast();

  async function zet(patch: Partial<Nest>, melding: string) {
    const vorig = Object.fromEntries(Object.keys(patch).map((k) => [k, nest[k as keyof Nest]])) as Partial<Nest>;
    onNest(patch);
    const { error } = await supabase.from('nests').update(patch).eq('id', nest.id);
    if (error) {
      onNest(vorig);
      toast('Opslaan lukte niet');
    } else toast(melding);
  }

  const vink = (veld: VertrouwenVeld, label: string) => {
    const aan = Boolean(nest[veld]);
    return (
      <label key={veld} className={`gv-vink${aan ? ' aan' : ''}`}>
        <input type="checkbox" checked={aan} onChange={() => zet({ [veld]: !aan } as Partial<Nest>, `${label}: ${aan ? 'uit' : 'aan'}`)} />
        <span>{label}</span>
      </label>
    );
  };

  const vertrouwen = VERTROUWEN_NEST.filter(([v]) => {
    if (v === 'stamboom_papieren') return nest.stamboom === true;
    if (v === 'ouders_te_zien') return nest.soort !== 'vondeling';
    return true;
  });

  return (
    <section className="panel" id="sectie-gezondheid" aria-labelledby="gv-kop">
      <h2 id="gv-kop">Gezondheid en vertrouwen</h2>
      <p className="hint" style={{ marginTop: -4 }}>
        Geldt voor het hele nestje. Vink alleen aan wat klopt; wat je niet aanvinkt, komt niet op je pagina. Kopers kunnen hier
        straks op zoeken.
      </p>

      <div className="veld">
        <span>Wat betekenen de gezondheidsvinkjes?</span>
        <div className="seg" role="group" aria-label="Wat betekenen de gezondheidsvinkjes?">
          <button
            type="button"
            aria-pressed={!nest.gezondheid_bij_verhuizing}
            onClick={() => nest.gezondheid_bij_verhuizing && zet({ gezondheid_bij_verhuizing: false }, 'Gezondheid: al gedaan')}
          >
            Al gedaan
          </button>
          <button
            type="button"
            aria-pressed={nest.gezondheid_bij_verhuizing}
            onClick={() => !nest.gezondheid_bij_verhuizing && zet({ gezondheid_bij_verhuizing: true }, 'Gezondheid: bij verhuizing')}
          >
            Geregeld bij verhuizing
          </button>
        </div>
      </div>

      <h3 className="gv-sub">Gezondheid</h3>
      <div className="gv-lijst">{GEZONDHEID_NEST.map(([v, l]) => vink(v, l))}</div>
      <details className="waarom">
        <summary>Waarom gechipt en ingeënt voordat een kitten verhuist?</summary>
        <p>
          Met een chip vindt een kitten dat wegloopt of zoekraakt veel makkelijker zijn weg terug naar huis. De eerste enting
          beschermt tegen kattenziekte en niesziekte, die voor jonge kittens heel gevaarlijk zijn. Volgens de huisregels zet je een
          kitten daarom pas op Verhuisd als Gechipt en 1e enting zijn aangevinkt.
        </p>
      </details>

      <h3 className="gv-sub">Vertrouwen en kennismaken</h3>
      <div className="gv-lijst">{vertrouwen.map(([v, l]) => vink(v, l))}</div>
    </section>
  );
}
