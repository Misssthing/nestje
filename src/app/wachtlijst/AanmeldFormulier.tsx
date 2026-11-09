'use client';

import { useActionState } from 'react';
import type { FormStaat } from './acties';

type Waarden = {
  naam?: string; email?: string; woonplaats?: string;
  voorkeur_geslacht?: string; voorkeur_vacht?: string | null; motivatie?: string | null; ras?: string;
};

type Props = {
  actie: (vorige: FormStaat, data: FormData) => Promise<FormStaat>;
  /** Verborgen velden, zoals de slug van het nestje of het token */
  verborgen?: Record<string, string>;
  knop: string;
  /** Toon de rassenkeuze (raslijst) */
  rassen?: string[];
  waarden?: Waarden;
  /** E-mailadres niet wijzigbaar (bij wijzigen van een bestaande aanmelding) */
  emailVast?: boolean;
  uitleg?: string;
};

export default function AanmeldFormulier({ actie, verborgen = {}, knop, rassen, waarden = {}, emailVast, uitleg }: Props) {
  const [staat, verstuur, bezig] = useActionState(actie, {});
  const w = { ...waarden, ...(staat.waarden ?? {}) };

  if (staat.klaar) {
    return (
      <div className="panel wl-klaar" role="status">
        <p style={{ margin: 0 }}>{staat.klaar}</p>
      </div>
    );
  }

  return (
    <form action={verstuur} className="wl-form" noValidate>
      {Object.entries(verborgen).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {/* Spamval: mensen zien dit veld niet */}
      <label className="wl-val" aria-hidden="true">
        Laat leeg <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      {rassen && (
        <label className="veld">
          <span>Ras</span>
          <select id="wl-ras" name="ras" defaultValue={w.ras ?? ''} required>
            <option value="" disabled>Kies een ras</option>
            {rassen.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      )}

      <div className="row stapel">
        <label className="veld">
          <span>Je naam</span>
          <input id="wl-naam" name="naam" defaultValue={w.naam ?? ''} maxLength={80} autoComplete="name" required />
        </label>
        <label className="veld">
          <span>Woonplaats</span>
          <input id="wl-woonplaats" name="woonplaats" defaultValue={w.woonplaats ?? ''} maxLength={80} autoComplete="address-level2" required />
        </label>
      </div>

      <label className="veld">
        <span>E-mailadres</span>
        <input
          id="wl-email" name="email" type="email" inputMode="email" autoComplete="email"
          defaultValue={w.email ?? ''} maxLength={200} required readOnly={emailVast}
        />
        {emailVast && <p className="hint">Ander e-mailadres? Meld je af en meld je opnieuw aan.</p>}
      </label>

      <fieldset className="veld wl-voorkeur">
        <legend>Voorkeur</legend>
        <div className="seg" role="radiogroup" aria-label="Voorkeur kater of poes">
          {[['geen', 'Geen voorkeur'], ['kater', 'Kater'], ['poes', 'Poes']].map(([v, l]) => (
            <label key={v} className="wl-keuze">
              <input type="radio" name="voorkeur_geslacht" value={v} defaultChecked={(w.voorkeur_geslacht ?? 'geen') === v} />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="veld">
        <span>Vacht of kleur (optioneel)</span>
        <input id="wl-vacht" name="voorkeur_vacht" defaultValue={w.voorkeur_vacht ?? ''} maxLength={80} placeholder="Bijv. blauw, of maakt niet uit" />
      </label>

      <label className="veld">
        <span>Iets over jezelf (optioneel)</span>
        <textarea
          id="wl-motivatie" name="motivatie" rows={4} maxLength={1000} defaultValue={w.motivatie ?? ''}
          placeholder="Bijvoorbeeld: hoe je woont, of je andere huisdieren hebt, en of de kat naar buiten mag."
        />
      </label>

      {uitleg && <p className="hint">{uitleg}</p>}
      {staat.fout && <p className="fout" role="alert">{staat.fout}</p>}

      <button className="btn primary" type="submit" disabled={bezig}>
        {bezig ? 'Bezig…' : knop}
      </button>
    </form>
  );
}
