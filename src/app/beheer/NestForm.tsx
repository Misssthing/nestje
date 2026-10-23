'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { normaliseerNummer, RASSEN, toonNummer } from '@/lib/nest';
import type { Nest } from '@/lib/types';

type Props = {
  nest: Nest;
  supabase: SupabaseClient;
  onOpgeslagen: (n: Nest) => void;
  openStandaard: boolean;
};

export default function NestForm({ nest, supabase, onOpgeslagen, openStandaard }: Props) {
  const toast = useToast();
  const [v, setV] = useState({
    moeder_naam: nest.moeder_naam,
    woonplaats: nest.woonplaats ?? '',
    geboortedatum: nest.geboortedatum,
    verhuisleeftijd_weken: String(nest.verhuisleeftijd_weken),
    prijs: nest.prijs != null ? String(nest.prijs) : '',
    whatsapp: toonNummer(nest.whatsapp_nummer),
    over_moeder: nest.over_moeder ?? '',
    vader_naam: nest.vader_naam ?? '',
    moeder_ras: nest.moeder_ras ?? '',
    vader_ras: nest.vader_ras ?? '',
    over_vader: nest.over_vader ?? '',
  });
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);
  const zet = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  async function bewaar(e: React.FormEvent) {
    e.preventDefault();
    setFout('');
    const nummer = v.whatsapp.trim() ? normaliseerNummer(v.whatsapp) : null;
    if (v.whatsapp.trim() && !nummer) return setFout('Dit WhatsApp-nummer klopt niet. Gebruik bijvoorbeeld 06 12345678.');
    const weken = Number(v.verhuisleeftijd_weken);
    if (!Number.isInteger(weken) || weken < 8 || weken > 26) return setFout('Verhuisleeftijd moet tussen 8 en 26 weken liggen.');
    const prijs = v.prijs.trim() ? Number(v.prijs.replace(',', '.')) : null;
    if (prijs != null && (Number.isNaN(prijs) || prijs < 0)) return setFout('Vul een geldige prijs in.');

    const patch = {
      moeder_naam: v.moeder_naam.trim(),
      woonplaats: v.woonplaats.trim() || null,
      geboortedatum: v.geboortedatum,
      verhuisleeftijd_weken: weken,
      prijs,
      whatsapp_nummer: nummer,
      over_moeder: v.over_moeder.trim() || null,
      vader_naam: v.vader_naam.trim() || null,
      moeder_ras: v.moeder_ras.trim() || null,
      vader_ras: v.vader_ras.trim() || null,
      over_vader: v.over_vader.trim() || null,
    };
    setBezig(true);
    const { error } = await supabase.from('nests').update(patch).eq('id', nest.id);
    setBezig(false);
    if (error) return setFout('Opslaan lukte niet. Controleer de velden.');
    onOpgeslagen({ ...nest, ...patch });
    setV((s) => ({ ...s, whatsapp: toonNummer(nummer) }));
    toast('Gegevens opgeslagen');
  }

  return (
    <details className="panel" open={openStandaard}>
      <summary>Gegevens</summary>
      <form onSubmit={bewaar}>
        <div className="row stapel">
          <label className="veld">
            <span>Naam moeder</span>
            <input value={v.moeder_naam} onChange={zet('moeder_naam')} maxLength={60} required />
          </label>
          <label className="veld">
            <span>Ras moeder (optioneel)</span>
            <input list="rassen" value={v.moeder_ras} onChange={zet('moeder_ras')} maxLength={60} placeholder="Bijv. Europese korthaar" />
          </label>
        </div>
        <datalist id="rassen">
          {RASSEN.map((r) => <option key={r} value={r} />)}
        </datalist>
        <label className="veld">
          <span>Woonplaats</span>
          <input value={v.woonplaats} onChange={zet('woonplaats')} maxLength={80} />
        </label>
        <div className="row stapel">
          <label className="veld">
            <span>Kittens geboren op</span>
            <input type="date" value={v.geboortedatum} onChange={zet('geboortedatum')} required />
          </label>
          <label className="veld">
            <span>Mag verhuizen na (weken)</span>
            <input type="number" inputMode="numeric" min={8} max={26} value={v.verhuisleeftijd_weken} onChange={zet('verhuisleeftijd_weken')} />
          </label>
        </div>
        <div className="row stapel">
          <label className="veld">
            <span>WhatsApp-nummer</span>
            <input type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12345678" value={v.whatsapp} onChange={zet('whatsapp')} />
          </label>
          <label className="veld">
            <span>Prijs per kitten (€)</span>
            <input inputMode="decimal" value={v.prijs} onChange={zet('prijs')} placeholder="Optioneel" />
          </label>
        </div>
        <p className="hint" style={{ marginTop: -4, marginBottom: 10 }}>
          Je nummer staat nergens als tekst op de pagina. Kopers tikken op “Vraag naar …” en komen dan in WhatsApp bij jou uit.
        </p>
        <label className="veld">
          <span>Over de moeder</span>
          <textarea value={v.over_moeder} onChange={zet('over_moeder')} maxLength={2000} placeholder="Karakter, gezondheid, hoe de kittens opgroeien…" />
        </label>
        <div className="row stapel">
          <label className="veld">
            <span>Naam vader (optioneel)</span>
            <input value={v.vader_naam} onChange={zet('vader_naam')} maxLength={60} />
          </label>
          <label className="veld">
            <span>Ras vader (optioneel)</span>
            <input list="rassen" value={v.vader_ras} onChange={zet('vader_ras')} maxLength={60} />
          </label>
        </div>
        <label className="veld">
          <span>Over de vader (optioneel)</span>
          <textarea value={v.over_vader} onChange={zet('over_vader')} maxLength={1000} placeholder="Ras, karakter, uiterlijk…" />
          <p className="hint">Is de vader onbekend? Laat de vadervelden leeg, dan staat er niets over hem op je pagina.</p>
        </label>
        {fout && <p className="fout">{fout}</p>}
        <button className="btn primary" disabled={bezig}>{bezig ? 'Bezig…' : 'Gegevens opslaan'}</button>
      </form>
    </details>
  );
}
