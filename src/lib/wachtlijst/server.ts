import { createClient, type SupabaseClient } from '@supabase/supabase-js';
export { RASLIJST_RASSEN } from './rassen';

/**
 * Supabase met de service-sleutel. Alleen op de server gebruiken: deze sleutel omzeilt de beveiligingsregels.
 * Nodig in Vercel: NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY.
 */
export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sleutel = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !sleutel) throw new Error('NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt in Vercel.');
  return createClient(url, sleutel, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** E-mailadres van de verkoper van een nestje, voor meldingen. */
export async function verkoperEmail(ownerId: string) {
  const { data } = await adminClient().auth.admin.getUserById(ownerId);
  return data.user?.email ?? null;
}

export const AANBOD_UREN = 72;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Aanmelding = {
  naam: string;
  email: string;
  woonplaats: string;
  voorkeur_geslacht: 'kater' | 'poes' | 'geen';
  voorkeur_vacht: string | null;
  motivatie: string | null;
};

/** Leest en controleert het aanmeldformulier. Geeft een foutmelding in gewone taal terug. */
export function leesAanmelding(f: FormData): { gegevens?: Aanmelding; fout?: string } {
  const t = (k: string, max: number) => String(f.get(k) ?? '').trim().slice(0, max);
  const naam = t('naam', 80);
  const email = t('email', 200).toLowerCase();
  const woonplaats = t('woonplaats', 80);
  const g = t('voorkeur_geslacht', 10);
  if (!naam) return { fout: 'Vul je naam in.' };
  if (!EMAIL.test(email)) return { fout: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.' };
  if (!woonplaats) return { fout: 'Vul je woonplaats in.' };
  return {
    gegevens: {
      naam,
      email,
      woonplaats,
      voorkeur_geslacht: g === 'kater' || g === 'poes' ? g : 'geen',
      voorkeur_vacht: t('voorkeur_vacht', 80) || null,
      motivatie: t('motivatie', 1000) || null,
    },
  };
}

/** Verborgen veld dat mensen niet zien maar spambots wel invullen. */
export function isBot(f: FormData) {
  return String(f.get('website') ?? '').trim() !== '';
}

export function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
