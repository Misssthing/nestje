'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

/**
 * Anonieme bezoekersstatistieken (Vercel Web Analytics, zonder cookies).
 * Inlog- en beheerpagina's tellen niet mee, en webadressen gaan zonder ?… of #… mee,
 * zodat inlogcodes nooit in de statistieken belanden.
 */
function filter(event: BeforeSendEvent) {
  const url = new URL(event.url);
  if (/^\/(auth|login|beheer)(\/|$)/.test(url.pathname)) return null;
  return { ...event, url: url.origin + url.pathname };
}

export default function Meting() {
  return <Analytics beforeSend={filter} />;
}
