'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const SLEUTEL = 'nestje-overzicht';

/** Onthoudt het laatst bekeken overzicht (met filters), zodat je vanaf een nestje terug kunt. */
export function OnthoudOverzicht() {
  const pad = usePathname();
  const zoek = useSearchParams();
  useEffect(() => {
    try {
      const q = zoek.toString();
      sessionStorage.setItem(SLEUTEL, q ? `${pad}?${q}` : pad);
    } catch {
      // Geen opslag beschikbaar: dan gaat de terugknop gewoon naar alle kittens
    }
  }, [pad, zoek]);
  return null;
}

/** "← Terug naar Brits korthaar": terug naar het overzicht zoals de koper het had gefilterd. */
export function TerugNaarOverzicht({ className }: { className?: string }) {
  const [doel, setDoel] = useState({ href: '/kittens', tekst: '← Alle kittens' });
  useEffect(() => {
    try {
      const href = sessionStorage.getItem(SLEUTEL);
      if (!href || !href.startsWith('/kittens')) return;
      const params = new URLSearchParams(href.split('?')[1] ?? '');
      const ras = params.get('ras');
      const geslacht = params.get('geslacht');
      const provincie = params.get('provincie');
      let tekst = '← Alle kittens';
      if (ras) tekst = `← Terug naar ${ras}`;
      else if (geslacht === 'kater') tekst = '← Terug naar de katers';
      else if (geslacht === 'poes') tekst = '← Terug naar de poezen';
      else if (provincie) tekst = `← Terug naar ${provincie}`;
      else if ([...params.keys()].length) tekst = '← Terug naar je zoekresultaten';
      setDoel({ href, tekst });
    } catch {
      // Geen opslag beschikbaar: standaardlink blijft staan
    }
  }, []);
  return (
    <Link href={doel.href} className={className}>
      {doel.tekst}
    </Link>
  );
}
