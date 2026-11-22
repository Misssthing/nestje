'use client';

import { useToast } from '@/components/Toast';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import FotoBeheer from '@/components/FotoBeheer';
import { CONFIG } from '@/lib/config';
import { STATUS_LABEL, STATUSSEN } from '@/lib/nest';
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
  /** Huisregel: verhuizen kan pas als het nestje gechipt en ingeënt is (bij Gezondheid en vertrouwen) */
  magVerhuizen: boolean;
};

export default function KittenKaart({ kitten, nestId, nestSlug, supabase, eerste, laatste, onWijzig, onFotos, onVerwijder, onVerplaats, magVerhuizen }: Props) {
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
              if (s === 'verhuisd' && !magVerhuizen) {
                toast('Vink eerst Gechipt en 1e enting aan bij “Gezondheid en vertrouwen”. Kittens verhuizen gechipt en ingeënt.');
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
            Een afbeelding met foto, naam en aftelling, voor je story op Instagram, Facebook, TikTok of WhatsApp. Zonder prijs,
            “te koop” of telefoonnummer, zodat het een update is en geen advertentie. Zet je link erbij met de linksticker in je
            story, of in je bio.
          </p>
        </div>
      )}
      <button className="btn danger klein" style={{ alignSelf: 'flex-start' }} onClick={onVerwijder}>
        Kitten verwijderen
      </button>
    </article>
  );
}
