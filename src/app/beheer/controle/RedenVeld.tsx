'use client';

import { useState } from 'react';

/** Tekstveld voor de reden, met veelgebruikte zinnen die je met één tik invult. */
export default function RedenVeld({ id, redenen }: { id: string; redenen: string[] }) {
  const [tekst, setTekst] = useState('');
  return (
    <>
      <label className="veld">
        <span>Wat moet de verkoper aanpassen?</span>
        <textarea id={`reden-${id}`} name="reden" rows={3} maxLength={1000} required value={tekst} onChange={(e) => setTekst(e.target.value)} />
      </label>
      <div className="ctl-redenen">
        {redenen.map((r) => (
          <button key={r} type="button" className="chipknop" onClick={() => setTekst((t) => (t ? `${t}\n${r}` : r))}>
            {r}
          </button>
        ))}
      </div>
    </>
  );
}
