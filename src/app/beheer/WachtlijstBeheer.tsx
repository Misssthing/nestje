'use client';

import { useCallback, useEffect, useState } from 'react';

type Rij = {
  id: string; naam: string; email: string; woonplaats: string;
  voorkeur_geslacht: 'kater' | 'poes' | 'geen'; voorkeur_vacht: string | null; motivatie: string | null;
  aangemeld_op: string; status: 'wachtend' | 'aangeboden' | 'geaccepteerd' | 'gesloten';
  kitten_id: string | null; aanbod_verloopt_op: string | null; geweigerd_aantal: number; via_ras_id: string | null;
};
type Kitten = { id: string; naam: string; geslacht: 'kater' | 'poes'; status: string };
type Ander = { id: string; moeder_naam: string };

type Props = { nestId: string };

const STATUS: Record<Rij['status'], [string, string]> = {
  wachtend: ['Wacht', 'vrij'],
  aangeboden: ['Aangeboden', 'optie'],
  geaccepteerd: ['Ja gezegd', 'gereserveerd'],
  gesloten: ['Gesloten', 'verhuisd'],
};

const datum = (iso: string) =>
  new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' });
const tijd = (iso: string) =>
  new Date(iso).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });

export default function WachtlijstBeheer({ nestId }: Props) {
  const [rijen, setRijen] = useState<Rij[]>([]);
  const [kittens, setKittens] = useState<Kitten[]>([]);
  const [anderen, setAnderen] = useState<Ander[]>([]);
  const [laden, setLaden] = useState(true);
  const [bezig, setBezig] = useState<string | null>(null);
  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');
  const [keuze, setKeuze] = useState<Record<string, string>>({});
  const [doorKeuze, setDoorKeuze] = useState<Record<string, string>>({});
  const [weg, setWeg] = useState<string | null>(null);
  const [annuleer, setAnnuleer] = useState<string | null>(null);

  const ophalen = useCallback(async () => {
    const res = await fetch(`/api/wachtlijst/beheer?nest=${nestId}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setFout(data.fout ?? 'De wachtlijst laden lukte niet.');
    else {
      setRijen(data.rijen);
      setKittens(data.kittens);
      setAnderen(data.anderen);
    }
    setLaden(false);
  }, [nestId]);

  useEffect(() => {
    ophalen();
    try {
      const m = sessionStorage.getItem('wl-melding');
      if (m) {
        setMelding(m);
        sessionStorage.removeItem('wl-melding');
      }
    } catch {}
  }, [ophalen]);

  async function doe(rij: Rij, actie: string, extra: Record<string, string> = {}, gelukt = '') {
    setBezig(rij.id);
    setFout('');
    setMelding('');
    const res = await fetch('/api/wachtlijst/beheer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ actie, rijId: rij.id, ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setFout(data.fout ?? 'Dat lukte niet. Probeer het opnieuw.');
    else if (actie === 'aanbieden' || actie === 'intrekken' || actie === 'annuleren') {
      // De kittenkaarten bovenaan moeten de nieuwe status (Optie of Vrij) laten zien: pagina opnieuw laden.
      sessionStorage.setItem('wl-melding', gelukt);
      window.location.hash = 'wachtlijst';
      window.location.reload();
      return;
    } else setMelding(gelukt);
    setWeg(null);
    setAnnuleer(null);
    await ophalen();
    setBezig(null);
  }

  const vrij = kittens.filter((k) => k.status === 'vrij');
  const kittenNaam = (id: string | null) => kittens.find((k) => k.id === id)?.naam ?? 'een kitten';
  const actief = rijen.filter((r) => r.status !== 'gesloten');
  const wachtend = rijen.filter((r) => r.status === 'wachtend').length;

  return (
    <details id="wachtlijst" className="panel wl-beheer" open={wachtend > 0 || rijen.some((r) => r.status === 'aangeboden')}>
      <summary className="aanpassen">
        Wachtlijst {laden ? '' : `(${actief.length})`}
      </summary>
      <p className="hint" style={{ marginTop: 0 }}>
        Kopers melden zich aan via de knop op je nestjespagina. Jij kiest wie een kitten krijgt aangeboden. De koper heeft
        dan 72 uur om ja of nee te zeggen en krijgt alle mails automatisch.
      </p>

      {fout && <p className="fout" role="alert">{fout}</p>}
      {melding && <p className="toast-melding" role="status">{melding}</p>}
      {laden && <p className="hint">Laden…</p>}
      {!laden && rijen.length === 0 && <p className="hint">Nog niemand op de wachtlijst.</p>}

      <ol className="wl-lijst">
        {rijen.map((r, i) => {
          const [label, kleur] = STATUS[r.status];
          const voorkeur = [r.voorkeur_geslacht === 'geen' ? '' : r.voorkeur_geslacht, r.voorkeur_vacht].filter(Boolean).join(', ');
          return (
            <li key={r.id} className={`wl-rij${r.status === 'gesloten' ? ' is-gesloten' : ''}`}>
              <div className="wl-kop">
                <span className="wl-plek" aria-label={`Plek ${i + 1}`}>{i + 1}</span>
                <div className="wl-wie">
                  <strong>{r.naam}</strong>
                  <span>{r.woonplaats} · aangemeld {datum(r.aangemeld_op)}</span>
                </div>
                <span className={`chip ${kleur}`}>{label}</span>
              </div>

              <div className="wl-info">
                <a href={`mailto:${r.email}`}>{r.email}</a>
                {voorkeur && <span>Voorkeur: {voorkeur}</span>}
                {r.via_ras_id && <span>Via de raslijst</span>}
                {r.geweigerd_aantal > 0 && <span>{r.geweigerd_aantal}× nee gezegd</span>}
              </div>
              {r.motivatie && <p className="wl-motivatie">{r.motivatie}</p>}

              {r.status === 'aangeboden' && (
                <div className="wl-acties">
                  <span>
                    {kittenNaam(r.kitten_id)} aangeboden, reactie uiterlijk {r.aanbod_verloopt_op ? tijd(r.aanbod_verloopt_op) : ''}
                  </span>
                  <button className="btn ghost klein" disabled={bezig === r.id} onClick={() => doe(r, 'intrekken', {}, 'Aanbod ingetrokken.')}>
                    Aanbod intrekken
                  </button>
                </div>
              )}

              {r.status === 'geaccepteerd' && (
                <div className="wl-acties">
                  <span>{kittenNaam(r.kitten_id)} is voor {r.naam} gereserveerd.</span>
                  {kittens.find((k) => k.id === r.kitten_id)?.status === 'vrij' && (
                    <span className="fout" style={{ margin: 0 }}>
                      Let op: {kittenNaam(r.kitten_id)} staat weer op vrij. Gaat de koop niet door? Annuleer dan hieronder de reservering.
                    </span>
                  )}
                  {annuleer === r.id ? (
                    <span className="wl-groep wl-annuleer">
                      <span>Gaat de koop niet door? {kittenNaam(r.kitten_id)} gaat dan terug naar vrij en {r.naam} krijgt een mail.</span>
                      <button
                        className="btn ghost klein"
                        disabled={bezig === r.id}
                        onClick={() => doe(r, 'annuleren', { terug: 'ja' }, `${r.naam} staat weer op de wachtlijst.`)}
                      >
                        Terug op de wachtlijst
                      </button>
                      <button
                        className="btn ghost klein"
                        disabled={bezig === r.id}
                        onClick={() => doe(r, 'annuleren', { terug: 'nee' }, `${r.naam} staat niet meer op je wachtlijst.`)}
                      >
                        Van de lijst halen
                      </button>
                      <button className="linkknop" onClick={() => setAnnuleer(null)}>Toch niet</button>
                    </span>
                  ) : (
                    <button className="linkknop" onClick={() => setAnnuleer(r.id)}>Reservering annuleren</button>
                  )}
                </div>
              )}

              {r.status === 'wachtend' && (
                <div className="wl-acties">
                  {vrij.length > 0 ? (
                    <span className="wl-groep">
                      <label className="sr-only" htmlFor={`wl-k-${r.id}`}>Kitten voor {r.naam}</label>
                      <select
                        id={`wl-k-${r.id}`}
                        value={keuze[r.id] ?? ''}
                        onChange={(e) => setKeuze((s) => ({ ...s, [r.id]: e.target.value }))}
                      >
                        <option value="">Kies een kitten</option>
                        {vrij.map((k) => (
                          <option key={k.id} value={k.id}>{k.naam} ({k.geslacht})</option>
                        ))}
                      </select>
                      <button
                        className="btn primary klein"
                        disabled={!keuze[r.id] || bezig === r.id}
                        onClick={() => doe(r, 'aanbieden', { kittenId: keuze[r.id] }, `${r.naam} krijgt een mail met het aanbod.`)}
                      >
                        Bied aan
                      </button>
                    </span>
                  ) : (
                    <span className="hint">Geen kittens vrij om aan te bieden.</span>
                  )}

                  {anderen.length > 0 && (
                    <span className="wl-groep">
                      <label className="sr-only" htmlFor={`wl-n-${r.id}`}>Doorschuiven naar</label>
                      <select
                        id={`wl-n-${r.id}`}
                        value={doorKeuze[r.id] ?? ''}
                        onChange={(e) => setDoorKeuze((s) => ({ ...s, [r.id]: e.target.value }))}
                      >
                        <option value="">Doorschuiven naar…</option>
                        {anderen.map((n) => (
                          <option key={n.id} value={n.id}>Nestje van {n.moeder_naam}</option>
                        ))}
                      </select>
                      <button
                        className="btn ghost klein"
                        disabled={!doorKeuze[r.id] || bezig === r.id}
                        onClick={() => doe(r, 'doorschuiven', { naarNestId: doorKeuze[r.id] }, `${r.naam} is doorgeschoven en krijgt een mail.`)}
                      >
                        Doorschuiven
                      </button>
                    </span>
                  )}

                  {weg === r.id ? (
                    <span className="wl-groep">
                      <span>{r.naam} van de lijst halen?</span>
                      <button className="btn ghost klein" disabled={bezig === r.id} onClick={() => doe(r, 'verwijderen', {}, `${r.naam} staat niet meer op je wachtlijst.`)}>
                        Ja, verwijderen
                      </button>
                      <button className="btn ghost klein" onClick={() => setWeg(null)}>Nee</button>
                    </span>
                  ) : (
                    <button className="linkknop" onClick={() => setWeg(r.id)}>Verwijderen</button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {anderen.length === 0 && wachtend > 0 && (
        <p className="hint">
          Doorschuiven kan naar een ander nestje van jou dat nog loopt. Is dit nestje vol of rond je het af, dan krijgen
          wachtenden automatisch een mail met andere nestjes van hetzelfde ras.
        </p>
      )}
    </details>
  );
}
