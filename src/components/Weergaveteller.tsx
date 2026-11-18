'use client';

import { useEffect } from 'react';

/**
 * Telt onzichtbaar één bezoek mee voor de verkoper (uitbreiding 34). Rendert niets.
 * Draait alleen in de browser, dus linkpreview-bots (WhatsApp, Facebook) tellen vanzelf niet mee.
 */
export default function Weergaveteller({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/n/${slug}/weergave`, { method: 'POST' }).catch(() => {
      // Geen probleem als dit een keer mislukt, het is maar een statistiekje.
    });
  }, [slug]);

  return null;
}
