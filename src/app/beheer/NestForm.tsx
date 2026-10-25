'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { normaliseerNummer, RASSEN, toonNummer } from '@/lib/nest';
import type { Nest } from '@/lib/types';

type Props = {
  nest: Nest;
  supabase: SupabaseClient;
  onOpgeslagen: (n: Nest) => void;
  openStandaard: boolean;
};

export default function NestForm({ nest, supabase, onOpgeslagen, openStandaard }: Props) {
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
    ouders_test_info: nest.ouders_test_info ?? '',
    moeder_gewicht: nest.moeder_gewicht != null ? String(nest.moeder_gewicht).replace('.', ',') : '',
    vader_gewicht: nest.vader_gewicht != null ? String(nest.vader_gewicht).replace('.', ',') : '',
    over_vader: nest.over_vader ?? '',
  });
  const [stamboom, setStamboom] = useState<boolean | null>(nest.stamboom);
  const [getest, setGetest] = useState<boolean | null>(nest.ouders_getest);
  const [bijVerhuizing, setBijVerhuizing] = useState<boolean>(nest.gezondheid_bij_verhuizing ?? false);
  const [fout, setFout] = useState('');
  const [status, setStatus] = useState<'opgeslagen' | 'wijzigingen' | 'bezig' | 'fout'>('opgeslagen');
  const zet = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  // Altijd de nieuwste invoer bij de hand, ook in timers en bij het verlaten van de pagina.
  const laatste = useRef({ v, stamboom, getest, bijVerhuizing });
  laatste.current = { v, stamboom, getest, bijVerhuizing };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openstaand = useRef(false);
  const bezig = useRef(false);
  const eersteKeer = useRef(true);
  // Via refs, zodat een opgeslagen nestje niet opnieuw een opslag in gang zet.
  const nestRef = useRef(nest);
  nestRef.current = nest;
  const onOpgeslagenRef = useRef(onOpgeslagen);
  onOpgeslagenRef.current = onOpgeslagen;

  const opslaan = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!openstaand.current) return;
    if (bezig.current) return; // na de lopende opslag volgt vanzelf een nieuwe ronde

    const { v, stamboom, getest, bijVerhuizing } = laatste.current;
    const stop = (melding: string) => {
      setFout(melding);
      setStatus('fout');
    };
    if (!v.moeder_naam.trim()) return stop('Vul de naam van de moeder in.');
    if (!v.geboortedatum) return stop('Vul de geboortedatum van de kittens in.');
    const nummer = v.whatsapp.trim() ? normaliseerNummer(v.whatsapp) : null;
    if (v.whatsapp.trim() && !nummer) return stop('Dit WhatsApp-nummer klopt niet. Gebruik bijvoorbeeld 06 12345678.');
    const weken = Number(v.verhuisleeftijd_weken);
    if (!Number.isInteger(weken) || weken < 8 || weken > 26) return stop('Verhuisleeftijd moet tussen 8 en 26 weken liggen.');
    const prijs = v.prijs.trim() ? Number(v.prijs.replace(',', '.')) : null;
    if (prijs != null && (Number.isNaN(prijs) || prijs < 0)) return stop('Vul een geldige prijs in.');
    const kg = (t: string) => (t.trim() ? Number(t.replace(',', '.')) : null);
    const mg = kg(v.moeder_gewicht);
    const vg = kg(v.vader_gewicht);
    if ([mg, vg].some((g) => g != null && (Number.isNaN(g) || g < 0.5 || g > 20)))
      return stop('Vul het gewicht in kilo’s in, bijvoorbeeld 5,2.');

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
      stamboom,
      moeder_gewicht: mg,
      vader_gewicht: vg,
      ouders_getest: getest,
      ouders_test_info: getest ? v.ouders_test_info.trim() || null : null,
      over_vader: v.over_vader.trim() || null,
      gezondheid_bij_verhuizing: bijVerhuizing,
    };

    openstaand.current = false;
    bezig.current = true;
    setStatus('bezig');
    const { error } = await supabase.from('nests').update(patch).eq('id', nestRef.current.id);
    bezig.current = false;
    if (error) {
      openstaand.current = true;
      return stop('Opslaan lukte niet. Controleer je internetverbinding en probeer het opnieuw.');
    }
    setFout('');
    onOpgeslagenRef.current({ ...nestRef.current, ...patch });
    if (openstaand.current) {
      // Tijdens het opslaan is er alweer iets gewijzigd
      setStatus('wijzigingen');
      timer.current = setTimeout(opslaan, 400);
    } else {
      setStatus('opgeslagen');
    }
  }, [supabase]);

  // Elke wijziging wordt kort na het typen vanzelf opgeslagen.
  useEffect(() => {
    if (eersteKeer.current) {
      eersteKeer.current = false;
      return;
    }
    openstaand.current = true;
    setStatus('wijzigingen');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(opslaan, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, stamboom, getest, bijVerhuizing]);

  // Wie de pagina verlaat of de app wegklikt, verliest niets.
  useEffect(() => {
    const bijVerlaten = () => {
      if (openstaand.current) void opslaan();
    };
    const bijVerbergen = () => {
      if (document.visibilityState === 'hidden') bijVerlaten();
    };
    window.addEventListener('pagehide', bijVerlaten);
    document.addEventListener('visibilitychange', bijVerbergen);
    return () => {
      window.removeEventListener('pagehide', bijVerlaten);
      document.removeEventListener('visibilitychange', bijVerbergen);
      bijVerlaten();
    };
  }, [opslaan]);

  function netjesNummer() {
    const nummer = normaliseerNummer(v.whatsapp);
    if (nummer) setV((s) => ({ ...s, whatsapp: toonNummer(nummer) }));
  }

  return (
    <details className="panel" open={openStandaard}>
      <summary>Gegevens</summary>
      <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>Wijzigingen worden vanzelf opgeslagen.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void opslaan();
        }}
        onBlur={() => void opslaan()}
      >
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
        <label className="veld">
          <span>Gewicht moeder in kg (optioneel)</span>
          <input inputMode="decimal" value={v.moeder_gewicht} onChange={zet('moeder_gewicht')} placeholder="Bijv. 5,2" />
        </label>
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
            <input type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12345678" value={v.whatsapp} onChange={zet('whatsapp')} onBlur={netjesNummer} />
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
          <span>Gewicht vader in kg (optioneel)</span>
          <input inputMode="decimal" value={v.vader_gewicht} onChange={zet('vader_gewicht')} placeholder="Bijv. 7,5" />
        </label>
        <label className="veld">
          <span>Over de vader (optioneel)</span>
          <textarea value={v.over_vader} onChange={zet('over_vader')} maxLength={1000} placeholder="Karakter, uiterlijk, hoe groot hij is…" />
          <p className="hint">Is de vader onbekend? Laat de vadervelden leeg, dan staat er niets over hem op je pagina.</p>
        </label>
        <div className="veld">
          <span>Gezondheidsvinkjes bij de kittens</span>
          <div className="seg" role="group" aria-label="Wat betekenen de gezondheidsvinkjes?">
            <button type="button" aria-pressed={!bijVerhuizing} onClick={() => setBijVerhuizing(false)}>Al gedaan</button>
            <button type="button" aria-pressed={bijVerhuizing} onClick={() => setBijVerhuizing(true)}>Bij verhuizing</button>
          </div>
          <p className="hint">Kies “Bij verhuizing” als je aanvinkt wat geregeld is wanneer de kittens de deur uitgaan, zoals chip en entingen.</p>
        </div>
        <JaNee label="Stamboom" waarde={stamboom} onChange={setStamboom} />
        <JaNee label="Ouders getest op erfelijke aandoeningen" waarde={getest} onChange={setGetest} />
        {getest && (
          <label className="veld">
            <span>Waarop getest (optioneel)</span>
            <input value={v.ouders_test_info} onChange={zet('ouders_test_info')} maxLength={120} placeholder="Bijv. HCM, PKD" />
          </label>
        )}
        <p className={`opslagstatus${status === 'fout' ? ' fout' : ''}`} role="status" aria-live="polite">
          {status === 'fout'
            ? fout
            : status === 'bezig'
              ? 'Opslaan…'
              : status === 'wijzigingen'
                ? 'Wijzigingen worden opgeslagen…'
                : '✓ Alles is opgeslagen'}
        </p>
      </form>
    </details>
  );
}

function JaNee({ label, waarde, onChange }: { label: string; waarde: boolean | null; onChange: (w: boolean | null) => void }) {
  const opties: [boolean | null, string][] = [[true, 'Ja'], [false, 'Nee'], [null, 'Niet vermelden']];
  return (
    <div className="veld">
      <span>{label}</span>
      <div className="seg" role="group" aria-label={label}>
        {opties.map(([w, t]) => (
          <button type="button" key={t} aria-pressed={waarde === w} onClick={() => onChange(w)}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
