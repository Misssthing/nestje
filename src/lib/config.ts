// Vaste instellingen van Nestje. Pas hier aan, niet verspreid door de code.
export const CONFIG = {
  appNaam: 'Nestje',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  starterslijstUrl: 'https://www.kattenverzorging.com/wat-heb-je-nodig-voor-een-kitten/',
  moederSiteUrl: 'https://www.kattenverzorging.com/',
  contactEmail: 'nestje@kattenverzorging.com', // hulpvragen, privacy en voorwaarden
  bedrijf: {
    naam: 'MissThing',
    plaats: 'Capelle aan den IJssel',
    kvk: '68878214',
    btw: 'NL001636039B31',
  },
  juridischBijgewerkt: '27 oktober 2026',
  fotoBucket: 'kitten-fotos',
  maxFotosPerKitten: 5,
  maxNestFotos: 3,
  maxOmschrijving: 300,
  maxFotoPx: 1600,
  fotoKwaliteit: 0.85,
  standaardVerhuisleeftijd: 13,
} as const;

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Plakt UTM-tags aan links naar kattenverzorging.com, zodat ze herkenbaar zijn in je statistieken. */
export function metUtm(url: string, campagne: string, inhoud?: string) {
  const u = new URL(url);
  u.searchParams.set('utm_source', 'nestje');
  u.searchParams.set('utm_medium', 'referral');
  u.searchParams.set('utm_campaign', campagne);
  if (inhoud) u.searchParams.set('utm_content', inhoud);
  return u.toString();
}

export function fotoUrl(pad: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${CONFIG.fotoBucket}/${pad}`;
}
