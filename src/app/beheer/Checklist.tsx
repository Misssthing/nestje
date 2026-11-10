'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { stappen, type Plek } from '@/lib/controle';
import type { KittenMetFotos, Nest, NestFoto, Profiel } from '@/lib/types';

type Props = {
  nest: Nest;
  kittens: KittenMetFotos[];
  nestFotos: NestFoto[];
  supabase: SupabaseClient;
  onNest: (patch: Partial<Nest>) => void;
  profiel?: Profiel | null;
};

/** Spring naar een onderdeel van het beheer; klapt "Gegevens" open als dat nodig is. */
function ganaar(plek: Plek) {
  // Het profiel staat op de pagina "Je nestjes"
  if (plek === 'profiel') {
    window.location.href = '/beheer#profiel';
    return;
  }
  const el = document.getElementById(`sectie-${plek}`);
  if (!el) return;
  const details = el.matches('details') ? (el as HTMLDetailsElement) : el.querySelector('details');
  if (details) details.open = true;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Checklist({ nest, kittens, nestFotos, supabase, onNest, profiel }: Props) {
  const lijst = stappen(nest, kittens, nestFotos, profiel);
  const klaar = lijst.filter((s) => s.klaar).length;
  const alles = klaar === lijst.length;
  const missendVoorOverzicht = lijst.filter((s) => s.voorOverzicht && !s.klaar);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  async function opnieuw() {
    setBezig(true);
    setFout('');
    const { error } = await supabase.from('nests').update({ controle_status: 'wacht' }).eq('id', nest.id);
    setBezig(false);
    if (error) setFout('Opnieuw indienen lukte niet. Probeer het opnieuw.');
    else onNest({ controle_status: 'wacht' });
  }

  // Wat is de stand voor het openbare overzicht?
  let stand: { soort: 'ok' | 'wacht' | 'actie' | 'info'; kop: string; tekst: string };
  if (nest.afgerond) {
    stand = { soort: 'info', kop: 'Dit nestje is afgerond', tekst: 'Je pagina blijft bestaan. Het nestje staat niet meer in het overzicht.' };
  } else if (nest.controle_status === 'aanpassen') {
    stand = {
      soort: 'actie',
      kop: 'Pas je nestje aan voor het overzicht',
      tekst: nest.controle_reden?.trim() || 'Bij de controle viel ons iets op. Kijk je gegevens na.',
    };
  } else if (missendVoorOverzicht.length) {
    stand = {
      soort: 'info',
      kop: `Nog ${missendVoorOverzicht.length === 1 ? '1 stap' : `${missendVoorOverzicht.length} stappen`} tot het overzicht`,
      tekst: 'Je link werkt al en je kunt hem delen. Wil je ook gevonden worden op Nestje, maak dan de stappen met een ster af.',
    };
  } else if (nest.controle_status === 'wacht') {
    stand = {
      soort: 'wacht',
      kop: 'In controle',
      tekst: 'We bekijken je nestje voordat het in het overzicht komt, meestal binnen 24 uur. Je krijgt een mail. Je link werkt al.',
    };
  } else {
    stand = { soort: 'ok', kop: 'Je nestje staat in het overzicht', tekst: 'Kopers vinden je nu ook via Nestje.' };
  }

  return (
    <section className="panel checklist" aria-labelledby="checklist-kop">
      <div className={`cl-stand ${stand.soort}`} role={stand.soort === 'actie' ? 'alert' : undefined}>
        <strong>{stand.kop}</strong>
        <p>{stand.tekst}</p>
        {stand.soort === 'actie' && (
          <>
            <p className="hint" style={{ margin: '6px 0 0' }}>
              Ras, stamboom of de foto van de moeder aangepast? Dan gaat je nestje vanzelf opnieuw in controle.
            </p>
            <button className="btn primary klein" style={{ marginTop: 10 }} disabled={bezig} onClick={opnieuw}>
              {bezig ? 'Bezig…' : 'Ik heb het aangepast, controleer opnieuw'}
            </button>
            {fout && <p className="fout">{fout}</p>}
          </>
        )}
      </div>

      <details open={!alles}>
        <summary className="cl-kop" id="checklist-kop">
          <span>Je nestjespagina compleet maken</span>
          <span className="cl-teller">{klaar} van {lijst.length}</span>
        </summary>
        <div className="cl-balk" aria-hidden="true">
          <span style={{ width: `${(klaar / lijst.length) * 100}%` }} />
        </div>
        <ol className="cl-lijst">
          {lijst.map((s) => (
            <li key={s.id} className={s.klaar ? 'cl-klaar' : ''}>
              <span className="cl-vink" aria-hidden="true">{s.klaar ? '✓' : ''}</span>
              <div>
                <strong>
                  {s.tekst}
                  {s.voorOverzicht && <span className="cl-ster" title="Nodig voor het overzicht"> *</span>}
                </strong>
                {!s.klaar && <span className="cl-uitleg">{s.uitleg}</span>}
              </div>
              {!s.klaar && (
                <button className="linkknop" onClick={() => ganaar(s.plek)}>
                  Naar invullen
                </button>
              )}
              <span className="sr-only">{s.klaar ? 'Klaar' : 'Nog te doen'}</span>
            </li>
          ))}
        </ol>
        <p className="hint" style={{ marginBottom: 0 }}>* Nodig om in het overzicht van Nestje te komen.</p>
      </details>
    </section>
  );
}
