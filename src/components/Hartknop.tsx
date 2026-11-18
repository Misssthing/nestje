'use client';

import { useEffect, useState } from 'react';

const OPSLAGSLEUTEL = 'nestje_hartjes';

function gegeven(): string[] {
  try {
    const lijst = JSON.parse(localStorage.getItem(OPSLAGSLEUTEL) ?? '[]');
    return Array.isArray(lijst) ? lijst : [];
  } catch {
    return [];
  }
}

function onthoud(kittenId: string, geliket: boolean) {
  try {
    const lijst = gegeven();
    const nieuw = geliket ? [...new Set([...lijst, kittenId])] : lijst.filter((id) => id !== kittenId);
    localStorage.setItem(OPSLAGSLEUTEL, JSON.stringify(nieuw));
  } catch {
    // Geen localStorage beschikbaar (bijv. privénavigatie): knop werkt dan nog wel, alleen zonder te onthouden.
  }
}

/**
 * Hartje-knop per kitten, zichtbaar voor iedereen (uitbreiding 34). Geen account nodig: de browser
 * onthoudt zelf welke kittens je al een hartje gaf, via localStorage.
 */
export default function Hartknop({ kittenId, hartjes }: { kittenId: string; hartjes: number }) {
  const [aantal, setAantal] = useState(hartjes);
  const [geliket, setGeliket] = useState(false);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    setGeliket(gegeven().includes(kittenId));
  }, [kittenId]);

  async function klik() {
    if (bezig) return;
    setBezig(true);
    const nieuweStatus = !geliket;
    setGeliket(nieuweStatus);
    setAantal((n) => Math.max(0, n + (nieuweStatus ? 1 : -1)));

    try {
      const res = await fetch(`/api/kittens/${kittenId}/hartje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actie: nieuweStatus ? 'geven' : 'intrekken' }),
      });
      const data = (await res.json()) as { hartjes: number | null };
      if (typeof data.hartjes === 'number') setAantal(data.hartjes);
      onthoud(kittenId, nieuweStatus);
    } catch {
      // Mislukt: terugdraaien naar de oude stand.
      setGeliket(!nieuweStatus);
      setAantal((n) => Math.max(0, n + (nieuweStatus ? -1 : 1)));
    } finally {
      setBezig(false);
    }
  }

  return (
    <button
      type="button"
      className={`hartknop${geliket ? ' actief' : ''}`}
      onClick={klik}
      aria-pressed={geliket}
      aria-label={geliket ? 'Hartje intrekken' : 'Geef een hartje'}
    >
      <span aria-hidden="true">{geliket ? '♥' : '♡'}</span>
      {aantal > 0 && <span className="hartknop-aantal">{aantal}</span>}
    </button>
  );
}
