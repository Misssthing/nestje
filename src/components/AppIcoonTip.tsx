'use client';

import { useEffect, useState } from 'react';

const SLEUTEL = 'nestje-apptip-weg';

/**
 * Eenmalig tipje op het beheerscherm: Nestje als app-icoon op je telefoon zetten. Verdwijnt na wegklikken
 * blijvend (per browser), via localStorage. Komt pas in beeld na een client-render, zodat hij nooit
 * even flasht voor iemand die hem al wegklikte.
 */
export default function AppIcoonTip() {
  const [tonen, setTonen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SLEUTEL)) setTonen(true);
    } catch {
      setTonen(true);
    }
  }, []);

  function sluit() {
    setTonen(false);
    try {
      localStorage.setItem(SLEUTEL, '1');
    } catch {
      /* geen probleem, blijft dan gewoon staan bij een volgend bezoek */
    }
  }

  if (!tonen) return null;

  return (
    <div className="panel apptip">
      <button type="button" className="apptip-sluit" onClick={sluit} aria-label="Tip wegklikken">×</button>
      <p style={{ margin: 0 }}>
        <strong>Tip:</strong> zet Nestje op je beginscherm, dan open je het als een echte app. Tik in je browser op
        “Zet op beginscherm” of “App installeren”.{' '}
        <a href="/hulp">Hoe dat werkt</a>
      </p>
    </div>
  );
}
