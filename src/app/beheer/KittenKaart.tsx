'use client';

import { useToast } from '@/components/Toast';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import FotoBeheer from '@/components/FotoBeheer';
import { CONFIG } from '@/lib/config';
import { GEZONDHEID, STATUS_LABEL, STATUSSEN } from '@/lib/nest';
import type { Foto, Kitten, KittenMetFotos } from '@/lib/types';

const VACHTEN = ['zwart', 'zwart/wit', 'rood', 'rood/wit', 'cyperse', 'cyperse/wit', 'schildpad', 'lapjes', 'blauw', 'blauw/wit', 'crème', 'wit'];

type Props = {
  kitten: KittenMetFotos;
  nestId: string;
  nestSlug: string;
  supabase: SupabaseClient;
  eerste: boolean;
  laatste: boolean;
  onWijzig: (patch: Partial<Kitten>, melding?: string) => void;
  onFotos: (fn: (f: Foto[]) => Foto[]) => void;
  onVerwijder: () => void;
  onVerplaats: (richting: -1 | 1) => void;
};

export default function KittenKaart({ kitten, nestId, nestSlug, supabase, eerste, laatste, onWijzig, onFotos, onVerwijder, onVerplaats }: Props) {
  const toast = useToast();
  const [naam, setNaam] = useState(kitten.naam);
  const [vacht, setVacht] = useState(kitten.vacht ?? '');
  const [omschrijving, setOmschrijving] = useState(kitten.omschrijving ?? '');
  const [notitie, setNotitie] = useState(kitten.notitie ?? '');
  const toonNotitie = kitten.status !== 'vrij' || Boolean(kitten.notitie);
  useEffect(() => setNaam(kitten.naam), [kitten.naam]);

  function bewaarNaam() {
    const n = naam.trim();
    if (!n) return setNaam(kitten.naam);
    if (n !== kitten.naam) onWijzig({ naam: n }, 'Naam opgeslagen');
  }

  function bewaarVacht() {
    const v = vacht.trim();
    if (v !== (kitten.vacht ?? '')) onWijzig({ vacht: v || null }, 'Vacht opgeslagen');
  }

  function bewaarOmschrijving() {
    const o = omschrijving.trim();
    if (o !== (kitten.omschrijving ?? '')) onWijzig({ omschrijving: o || null }, 'Omschrijving opgeslagen');
  }

  function bewaarNotitie() {
    const n = notitie.trim();
    if (n !== (kitten.notitie ?? '')) onWijzig({ notitie: n || null }, 'Notitie opgeslagen');
  }

  return (
    <article className="bkit">
      <div className="bkit-kop">
        <label className="sr-only" htmlFor={`naam-${kitten.id}`}>Naam</label>
        <input
          id={`naam-${kitten.id}`}
          value={naam}
          maxLength={40}
          onChange={(e) => setNaam(e.target.value)}
          onBlur={bewaarNaam}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        <button className="icoonknop" onClick={() => onVerplaats(-1)} disabled={eerste} aria-label={`${kitten.naam} omhoog`}>↑</button>
        <button className="icoonknop" onClick={() => onVerplaats(1)} disabled={laatste} aria-label={`${kitten.naam} omlaag`}>↓</button>
      </div>

      <div className="seg status" role="group" aria-label={`Status van ${kitten.naam}`}>
        {STATUSSEN.map((s) => (
          <button
            key={s}
            data-s={s}
            aria-pressed={kitten.status === s}
            onClick={() => {
              if (kitten.status === s) return;
              if (s === 'verhuisd' && !(kitten.gechipt && kitten.enting1)) {
                toast(`Vink eerst Gechipt en 1e enting aan. Kittens verhuizen gechipt en ingeënt; bij Gezondheid lees je waarom.`);
                return;
              }
              onWijzig({ status: s }, `${kitten.naam}: ${STATUS_LABEL[s].toLowerCase()}`);
            }}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {toonNotitie && (
        <label className="veld notitie" style={{ margin: 0 }}>
          <span>Notitie, alleen jij ziet dit</span>
          <textarea
            value={notitie}
            maxLength={500}
            rows={2}
            placeholder="Bijv. gereserveerd voor Sanne, aanbetaling ontvangen, ophalen 12 december"
            onChange={(e) => setNotitie(e.target.value)}
            onBlur={bewaarNotitie}
          />
        </label>
      )}

      <FotoBeheer
        supabase={supabase}
        fotos={kitten.kitten_photos}
        max={CONFIG.maxFotosPerKitten}
        tabel="kitten_photos"
        ouder={{ kolom: 'kitten_id', id: kitten.id }}
        map={`${nestId}/${kitten.id}`}
        naam={kitten.naam}
        onFotos={onFotos}
      />

      <div className="row">
        <div className="veld" style={{ margin: 0 }}>
          <span>Geslacht</span>
          <div className="seg" role="group" aria-label="Geslacht">
            {(['kater', 'poes'] as const).map((g) => (
              <button key={g} aria-pressed={kitten.geslacht === g} onClick={() => kitten.geslacht !== g && onWijzig({ geslacht: g })}>
                {g === 'kater' ? 'Kater' : 'Poes'}
              </button>
            ))}
          </div>
        </div>
        <label className="veld" style={{ margin: 0 }}>
          <span>Vacht</span>
          <input
            list="vachten"
            value={vacht}
            maxLength={60}
            placeholder="Bijv. zwart/wit"
            onChange={(e) => setVacht(e.target.value)}
            onBlur={bewaarVacht}
          />
          <datalist id="vachten">
            {VACHTEN.map((v) => <option key={v} value={v} />)}
          </datalist>
        </label>
      </div>

      <div className="veld" style={{ margin: 0 }}>
        <span>Gezondheid <span className="hint">(optioneel)</span></span>
        <div className="gz" role="group" aria-label={`Gezondheid van ${kitten.naam}`}>
          {GEZONDHEID.map(([v, label]) => (
            <button
              key={v}
              aria-pressed={kitten[v]}
              onClick={() => onWijzig({ [v]: !kitten[v] } as Partial<Kitten>, `${label}: ${kitten[v] ? 'uit' : 'aan'}`)}
            >
              {kitten[v] ? '✓ ' : ''}{label}
            </button>
          ))}
        </div>
        <p className="hint">Vink alleen aan wat geregeld is. Wat je niet aanvinkt, komt niet op de pagina.</p>
        <details className="waarom">
          <summary>Waarom gechipt en ingeënt voordat het kitten verhuist?</summary>
          <p>
            Met een chip vindt een kitten dat wegloopt of zoekraakt veel makkelijker zijn weg terug naar huis. De chip is de enige
            manier waarop een dierenarts of asiel kan zien van wie een kat is. De eerste enting beschermt tegen kattenziekte en
            niesziekte, die voor jonge kittens heel gevaarlijk kunnen zijn. Zo begint het kitten gezond en veilig aan zijn nieuwe
            leven. Een chip kost bij de dierenarts meestal een paar tientjes.
          </p>
        </details>
      </div>

      <label className="veld" style={{ margin: 0 }}>
        <span>Karakter</span>
        <textarea
          value={omschrijving}
          maxLength={CONFIG.maxOmschrijving}
          rows={3}
          placeholder="Bijv. speels, altijd als eerste bij de voerbak en valt graag in slaap op schoot."
          onChange={(e) => setOmschrijving(e.target.value)}
          onBlur={bewaarOmschrijving}
        />
        <p className="hint teller">{omschrijving.length}/{CONFIG.maxOmschrijving}</p>
      </label>

      {kitten.status !== 'verhuisd' && (
        <div className="veld" style={{ margin: 0 }}>
          <span>Nestupdate voor je story</span>
          <div className="storyrij">
            <a className="btn ghost klein" href={`/n/${nestSlug}/story/${kitten.id}?download=1`} download>
              Story-afbeelding downloaden
            </a>
            <a className="storylink" href={`/n/${nestSlug}/story/${kitten.id}`} target="_blank" rel="noopener">
              Bekijken
            </a>
          </div>
          <p className="hint">
            Een afbeelding met foto, naam en aftelling, voor Instagram of TikTok. Zonder prijs, “te koop” of telefoonnummer,
            zodat het een update is en geen advertentie. Zet je link erbij met de linksticker in je story, of in je bio.
          </p>
        </div>
      )}
      <button className="btn danger klein" style={{ alignSelf: 'flex-start' }} onClick={onVerwijder}>
        Kitten verwijderen
      </button>
    </article>
  );
}
