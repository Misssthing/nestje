// Vaste instellingen van Nestje. Pas hier aan, niet verspreid door de code.
export const CONFIG = {
  appNaam: 'Nestje',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  starterslijstUrl: 'https://www.kattenverzorging.com/starterslijst/',
  moederSiteUrl: 'https://www.kattenverzorging.com/',
  contactEmail: 'privacy@kattenverzorging.com', // nakijken
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

export function fotoUrl(pad: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${CONFIG.fotoBucket}/${pad}`;
}
