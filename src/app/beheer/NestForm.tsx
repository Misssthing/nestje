'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAX_DAGEN_VOORUIT, nestjeMelding, netjesRas, normaliseerNummer, ORGANISATIES, RASSEN, toonNummer,
  stamboomnrProbleem, VERBODEN_RAS, vraagtStamboom, type OuderTest,
} from '@/lib/nest';
import TestenLijst from './TestenLijst';
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
    stamboom_organisatie: nest.stamboom_organisatie ?? '',
    cattery: nest.cattery ?? '',
    moeder_stamboomnr: nest.moeder_stamboomnr ?? '',
    vader_stamboomnr: nest.vader_stamboomnr ?? '',
    moeder_chip: nest.moeder_chip ?? '',
  });
  const [stamboom, setStamboom] = useState<boolean | null>(nest.stamboom);
  const [getest] = useState<boolean | null>(nest.ouders_getest);
  const [geschat, setGeschat] = useState<boolean>(nest.geboortedatum_geschat ?? false);
  const [soort, setSoort] = useState<'eigen' | 'vondeling'>(nest.soort ?? 'eigen');
  const [mTesten, setMTesten] = useState<OuderTest[]>(nest.moeder_testen ?? []);
  const [vTesten, setVTesten] = useState<OuderTest[]>(nest.vader_testen ?? []);
  const [aandacht, setAandacht] = useState<string[]>([]);
  const [fout, setFout] = useState('');
  const [status, setStatus] = useState<'opgeslagen' | 'wijzigingen' | 'bezig' | 'fout'>('opgeslagen');
  const zet = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  // Altijd de nieuwste invoer bij de hand, ook in timers en bij het verlaten van de pagina.
  const laatste = useRef({ v, stamboom, getest, geschat, soort, mTesten, vTesten });
  laatste.current = { v, stamboom, getest, geschat, soort, mTesten, vTesten };
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

    const { v, getest, geschat, soort, mTesten, vTesten } = laatste.current;
    // Vondelingen hebben geen bekende afstamming, dus ook geen stamboom.
    const stamboom = soort === 'vondeling' ? null : laatste.current.stamboom;
    const stop = (melding: string) => {
      setFout(melding);
      setStatus('fout');
    };
    if (!v.moeder_naam.trim()) return stop('Vul de naam van de moeder in.');
    if (!v.geboortedatum) return stop('Vul de geboortedatum van de kittens in.');
    const uiterlijk = new Date(Date.now() + MAX_DAGEN_VOORUIT * 864e5).toISOString().slice(0, 10);
    if (v.geboortedatum > uiterlijk) return stop(`De uitgerekende datum mag maximaal ${MAX_DAGEN_VOORUIT} dagen vooruit liggen.`);
    const nummer = v.whatsapp.trim() ? normaliseerNummer(v.whatsapp) : null;
    if (v.whatsapp.trim() && !nummer) return stop('Dit WhatsApp-nummer klopt niet. Gebruik bijvoorbeeld 06 12345678.');
    const weken = Number(v.verhuisleeftijd_weken);
    if (!Number.isInteger(weken) || weken < 12 || weken > 26) return stop('Kittens verhuizen volgens de huisregels op zijn vroegst na 12 weken. Kies tussen 12 en 26 weken. Onder het veld lees je waarom.');
    const prijs = v.prijs.trim() ? Number(v.prijs.replace(',', '.')) : null;
    if (prijs != null && (Number.isNaN(prijs) || prijs < 0)) return stop('Vul een geldige prijs in.');
    const kg = (t: string) => (t.trim() ? Number(t.replace(',', '.')) : null);
    const mg = kg(v.moeder_gewicht);
    const vg = kg(v.vader_gewicht);
    if ([mg, vg].some((g) => g != null && (Number.isNaN(g) || g < 0.5 || g > 20)))
      return stop('Vul het gewicht in kilo’s in, bijvoorbeeld 5,2.');

    const rassen = `${v.moeder_ras} ${v.vader_ras}`;
    if (VERBODEN_RAS.test(rassen))
      return stop('Met dit ras mag in Nederland niet worden gefokt. Naaktkatten en katten met vouworen kunnen daarom niet op Nestje.');
    if ((vraagtStamboom(v.moeder_ras) || vraagtStamboom(v.vader_ras)) && stamboom !== true)
      return stop(
        soort === 'vondeling'
          ? 'Bij vondelingen is de afstamming onbekend. Kies bij het ras “Huiskat” of “Kruising”.'
          : 'Een rasnaam gebruik je alleen met stamboom. Kies “Huiskat” of “Kruising”, of zet Stamboom op Ja.',
      );
    if (stamboom === true) {
      const m = v.moeder_stamboomnr.trim();
      const va = v.vader_stamboomnr.trim();
      const pm = m && stamboomnrProbleem(m);
      if (pm) return stop(`Het stamboomnummer van de moeder ${pm}`);
      const pv = va && stamboomnrProbleem(va);
      if (pv) return stop(`Het stamboomnummer van de vader ${pv}`);
      if (m && va && m.replace(/\s/g, '').toLowerCase() === va.replace(/\s/g, '').toLowerCase())
        return stop('De stamboomnummers van moeder en vader zijn hetzelfde. Elke kat heeft een eigen nummer.');
    }
    const schoon = (t: OuderTest[]) =>
      t.filter((x) => x.test.trim()).map((x) => ({ test: x.test.trim(), uitslag: x.uitslag, datum: x.datum }));
    const mT = schoon(mTesten);
    const vT = schoon(vTesten);

    const patch = {
      moeder_naam: v.moeder_naam.trim(),
      woonplaats: v.woonplaats.trim() || null,
      geboortedatum: v.geboortedatum,
      verhuisleeftijd_weken: weken,
      prijs,
      whatsapp_nummer: nummer,
      over_moeder: v.over_moeder.trim() || null,
      vader_naam: v.vader_naam.trim() || null,
      moeder_ras: netjesRas(v.moeder_ras),
      vader_ras: netjesRas(v.vader_ras),
      stamboom,
      moeder_gewicht: mg,
      vader_gewicht: vg,
      ouders_getest: mT.length + vT.length > 0 ? true : getest,
      ouders_test_info: getest ? v.ouders_test_info.trim() || null : null,
      over_vader: v.over_vader.trim() || null,
      geboortedatum_geschat: geschat,
      soort,
      stamboom_organisatie: stamboom ? v.stamboom_organisatie || null : null,
      cattery: stamboom ? v.cattery.trim() || null : null,
      moeder_stamboomnr: stamboom ? v.moeder_stamboomnr.trim() || null : null,
      vader_stamboomnr: stamboom ? v.vader_stamboomnr.trim() || null : null,
      moeder_chip: v.moeder_chip.replace(/\s+/g, '') || null,
      moeder_testen: mT,
      vader_testen: vT,
    };

    openstaand.current = false;
    bezig.current = true;
    setStatus('bezig');
    const { error } = await supabase.from('nests').update(patch).eq('id', nestRef.current.id);
    bezig.current = false;
    if (error) {
      openstaand.current = true;
      return stop(nestjeMelding(error, 'Opslaan lukte niet. Controleer je internetverbinding en probeer het opnieuw.'));
    }
    setFout('');
    const punten: string[] = [];
    if (stamboom === true) {
      const mist = [
        !patch.stamboom_organisatie && 'organisatie',
        !patch.cattery && 'catterynaam',
        !patch.vader_naam && 'naam van de vader',
      ].filter(Boolean);
      if (mist.length)
        punten.push(`Nog niet compleet voor het label “Fokker · met stamboom”: ${mist.join(', ')}. Tot dan sta je als “Particulier”.`);
    }
    if (nestRef.current.in_overzicht && soort !== 'vondeling' && !nestRef.current.moeder_foto)
      punten.push('Je nestje verschijnt pas in het overzicht als er een foto van de moeder op staat.');
    setAandacht(punten);
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
  }, [v, stamboom, getest, geschat, soort, mTesten, vTesten]);

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

  /** “bkh” wordt na het typen “Brits korthaar”, zodat de verkoper ziet wat er wordt opgeslagen. */
  function netjesRasVeld(k: 'moeder_ras' | 'vader_ras') {
    setV((s) => {
      const netjes = netjesRas(s[k]) ?? '';
      return netjes === s[k] ? s : { ...s, [k]: netjes };
    });
  }

  function netjesNummer() {
    const nummer = normaliseerNummer(v.whatsapp);
    if (nummer) setV((s) => ({ ...s, whatsapp: toonNummer(nummer) }));
  }

  const labelCompleet = Boolean(v.stamboom_organisatie && v.cattery.trim() && v.vader_naam.trim());

  return (
    <details className="panel gegevens" open={openStandaard}>
      <summary className="aanpassen">
        <span aria-hidden="true">✎</span> Gegevens van je nestje
        <small>De moeder, geboorte, contact en prijs, de vader en de stamboom</small>
      </summary>
      <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>Wijzigingen worden vanzelf opgeslagen.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void opslaan();
        }}
        onBlur={() => void opslaan()}
      >
        <datalist id="rassen">
          {RASSEN.map((r) => <option key={r} value={r} />)}
        </datalist>

        <fieldset className="formblok">
          <legend>Soort nestje</legend>
          <div className="seg" role="group" aria-label="Soort nestje">
            <button type="button" aria-pressed={soort === 'eigen'} onClick={() => setSoort('eigen')}>Eigen poes</button>
            <button type="button" aria-pressed={soort === 'vondeling'} onClick={() => setSoort('vondeling')}>Vondelingen</button>
          </div>
          {soort === 'vondeling' && (
            <p className="hint">Is de moeder onbekend? Vul bij de naam bijvoorbeeld “de vondelingetjes” in. Een foto van de moeder is dan niet nodig, en je pagina krijgt het label “Vondelingen”.</p>
          )}
        </fieldset>

        <fieldset className="formblok">
          <legend>De moeder</legend>
          <div className="row stapel">
            <label className="veld">
              <span>Naam</span>
              <input value={v.moeder_naam} onChange={zet('moeder_naam')} maxLength={60} required />
            </label>
            <label className="veld">
              <span>Ras <small className="opt">optioneel</small></span>
              <input list="rassen" value={v.moeder_ras} onChange={zet('moeder_ras')} onBlur={() => netjesRasVeld('moeder_ras')} maxLength={60} placeholder="Bijv. Huiskat" />
            </label>
          </div>
          <p className="hint" style={{ marginTop: -4, marginBottom: 10 }}>
            Een rasnaam zoals Maine Coon gebruik je alleen met een stamboom. Zonder stamboom kies je “Huiskat” of “Kruising”.
          </p>
          <label className="veld">
            <span>Gewicht in kg <small className="opt">optioneel</small></span>
            <input inputMode="decimal" value={v.moeder_gewicht} onChange={zet('moeder_gewicht')} placeholder="Bijv. 5,2" />
          </label>
          {soort === 'eigen' && (
            <label className="veld">
              <span>Chipnummer <small className="opt">optioneel</small></span>
              <input inputMode="numeric" value={v.moeder_chip} onChange={zet('moeder_chip')} maxLength={20} placeholder="15 cijfers" />
              <p className="hint">Wordt nooit getoond. Zo houden we bij hoeveel nestjes een poes heeft.</p>
              <details className="waarom">
                <summary>Waarom vragen we dit, en is het veilig?</summary>
                <p>
                  Volgens de huisregels heeft een poes maximaal 2 nestjes per jaar. Aan de naam van een poes herken je haar niet
                  altijd: een naam typ je zo net iets anders. Het chipnummer is uniek, en daarmee houdt Nestje betrouwbaar bij hoeveel
                  nestjes ze heeft.
                </p>
                <p>
                  Het nummer staat nergens op je pagina of in het overzicht, en we delen het met niemand. Alleen jij en de beheerder van
                  Nestje kunnen het zien. Wil je het liever niet invullen, dan laat je het gewoon leeg.
                </p>
              </details>
            </label>
          )}
          <label className="veld">
            <span>Over de moeder <small className="opt">optioneel</small></span>
            <textarea value={v.over_moeder} onChange={zet('over_moeder')} maxLength={2000} placeholder="Karakter, gezondheid, hoe de kittens opgroeien…" />
          </label>
        </fieldset>

        <fieldset className="formblok">
          <legend>Geboorte en verhuizen</legend>
          <div className="row stapel">
            <label className="veld">
              <span>Geboren op, of uitgerekende datum</span>
              <input type="date" value={v.geboortedatum} onChange={zet('geboortedatum')} required />
            </label>
            <label className="veld">
              <span>Mag verhuizen na (weken)</span>
              <input type="number" inputMode="numeric" min={12} max={26} value={v.verhuisleeftijd_weken} onChange={zet('verhuisleeftijd_weken')} />
            </label>
          </div>
          <label className="vink" style={{ marginTop: -4, marginBottom: 10 }}>
            <input type="checkbox" checked={geschat} onChange={(e) => setGeschat(e.target.checked)} />
            <span>De geboortedatum is een schatting</span>
          </label>
          <details className="waarom">
            <summary>Waarom minstens 12 weken?</summary>
            <p>
              De weken tussen 8 en 12 zijn voor een kitten heel belangrijk. Bij zijn moeder en nestgenootjes leert hij spelen zonder
              te bijten, hoe hij met andere katten omgaat en hoe hij zichzelf verzorgt. Ook krijgen ze rond 9 en 12 weken hun eerste
              twee entingen. Met 12 weken is het kitten dus beter beschermd als het naar een nieuw huis gaat.
            </p>
            <p>
              Daarom hanteren ook verenigingen als WCF minimaal 12 weken, en FIFe zelfs 14. De wet staat 7 weken toe, maar op
              Nestje kiezen we voor wat het beste is voor het kitten.
            </p>
          </details>
        </fieldset>

        <fieldset className="formblok">
          <legend>Contact en prijs</legend>
          <div className="row stapel">
            <label className="veld">
              <span>WhatsApp-nummer</span>
              <input type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12345678" value={v.whatsapp} onChange={zet('whatsapp')} onBlur={netjesNummer} />
            </label>
            <label className="veld">
              <span>Prijs per kitten (€) <small className="opt">optioneel</small></span>
              <input inputMode="decimal" value={v.prijs} onChange={zet('prijs')} />
            </label>
          </div>
          <label className="veld">
            <span>Woonplaats</span>
            <input value={v.woonplaats} onChange={zet('woonplaats')} maxLength={80} />
          </label>
          <p className="hint" style={{ marginTop: -4, marginBottom: 0 }}>
            Je nummer staat nergens als tekst op de pagina. Kopers tikken op “Vraag naar …” en komen dan in WhatsApp bij jou uit.
            Je provincie kies je bovenaan, bij “Gevonden worden op Nestje”.
          </p>
        </fieldset>

        <fieldset className="formblok">
          <legend>De vader <small className="opt">optioneel</small></legend>
          <div className="row stapel">
            <label className="veld">
              <span>Naam</span>
              <input value={v.vader_naam} onChange={zet('vader_naam')} maxLength={60} />
            </label>
            <label className="veld">
              <span>Ras</span>
              <input list="rassen" value={v.vader_ras} onChange={zet('vader_ras')} onBlur={() => netjesRasVeld('vader_ras')} maxLength={60} />
            </label>
          </div>
          <label className="veld">
            <span>Gewicht in kg</span>
            <input inputMode="decimal" value={v.vader_gewicht} onChange={zet('vader_gewicht')} placeholder="Bijv. 7,5" />
          </label>
          <label className="veld">
            <span>Over de vader</span>
            <textarea value={v.over_vader} onChange={zet('over_vader')} maxLength={1000} placeholder="Karakter, uiterlijk, hoe groot hij is…" />
            <p className="hint">Is de vader onbekend? Laat dit blok leeg, dan staat er niets over hem op je pagina.</p>
          </label>
        </fieldset>

        {soort === 'eigen' && (
          <fieldset className="formblok">
            <legend>Stamboom en testen</legend>
            <JaNee label="Hebben de kittens een stamboom?" waarde={stamboom} onChange={setStamboom} />
            {stamboom !== true && (
              <p className="hint">Fok je met stamboom, als cattery? Kies Ja: dan krijg je het label “Fokker”. Anders sta je als “Particulier”.</p>
            )}
            {stamboom === true && (
              <div className="stamboomblok">
                <div className="labelcheck" role="status">
                  <strong>
                    {labelCompleet ? '✓ Je nestje krijgt het label “Fokker · met stamboom”' : 'Voor het label “Fokker · met stamboom” vul je deze drie in:'}
                  </strong>
                  <ul>
                    <li className={v.stamboom_organisatie ? 'ok' : ''}>Organisatie</li>
                    <li className={v.cattery.trim() ? 'ok' : ''}>Catterynaam</li>
                    <li className={v.vader_naam.trim() ? 'ok' : ''}>Naam van de vader (bij “De vader”)</li>
                  </ul>
                  {!labelCompleet && (
                    <p>Zonder deze drie staat je nestje er gewoon, maar als “Particulier” en zonder stamboomlabel.</p>
                  )}
                  <p className="labelcheck-extra">
                    <strong>Tip: vul ook de stamboomnummers in.</strong> Dan kunnen we je cattery controleren en krijg je het vinkje
                    “✓ Gecontroleerd”, plus een plek bovenaan bij Catteries. De nummers zijn alleen zichtbaar voor Nestje, nooit voor kopers.
                  </p>
                </div>
                <div className="row stapel">
                  <label className="veld">
                    <span>Organisatie</span>
                    <select value={v.stamboom_organisatie} onChange={zet('stamboom_organisatie')}>
                      <option value="">Kies…</option>
                      {ORGANISATIES.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                  <label className="veld">
                    <span>Catterynaam</span>
                    <input value={v.cattery} onChange={zet('cattery')} maxLength={80} />
                  </label>
                </div>
                <div className="row stapel">
                  <label className="veld">
                    <span>Stamboomnummer moeder <small className="opt">optioneel</small></span>
                    <input value={v.moeder_stamboomnr} onChange={zet('moeder_stamboomnr')} maxLength={40} />
                  </label>
                  <label className="veld">
                    <span>Stamboomnummer vader <small className="opt">optioneel</small></span>
                    <input value={v.vader_stamboomnr} onChange={zet('vader_stamboomnr')} maxLength={40} />
                  </label>
                </div>
                <details className="waarom">
                  <summary>Waarom vragen we de stamboomnummers, en is dat veilig?</summary>
                  <p>
                    Met de stamboomnummers kunnen we controleren of een stamboom klopt, bijvoorbeeld als hetzelfde nummer bij meerdere
                    verkopers opduikt. Zo beschermen we fokkers zoals jij tegen broodfokkers die zich als raskattenfokker voordoen.
                  </p>
                  <p>
                    Kopers zien de nummers niet. Ze zijn alleen zichtbaar voor jou en de beheerder van Nestje, en we delen ze met niemand.
                  </p>
                </details>
              </div>
            )}
            <TestenLijst titel="Testen moeder (optioneel)" ras={v.moeder_ras} testen={mTesten} onChange={setMTesten} />
            {(v.vader_naam.trim() || stamboom === true) && (
              <TestenLijst titel="Testen vader (optioneel)" ras={v.vader_ras || v.moeder_ras} testen={vTesten} onChange={setVTesten} />
            )}
            {mTesten.length + vTesten.length === 0 && getest && v.ouders_test_info && (
              <p className="hint">Eerder ingevuld: getest op {v.ouders_test_info}. Zet de testen hierboven per ouder, dan zien kopers ook de uitslag.</p>
            )}
          </fieldset>
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
        {aandacht.length > 0 && status !== 'fout' && (
          <ul className="aandacht">
            {aandacht.map((a) => <li key={a}>{a}</li>)}
          </ul>
        )}
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
