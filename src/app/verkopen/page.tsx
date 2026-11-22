import type { Metadata } from 'next';
import VerkoperStart from '@/components/VerkoperStart';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Kittens verkopen? Maak gratis je nestjespagina',
  description:
    'Maak binnen een minuut je nestjespagina en vul hem daarna rustig verder aan. Deel via WhatsApp en Facebook. Gratis, zonder wachtwoord.',
  alternates: { canonical: '/verkopen' },
};

export default async function Verkopen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <VerkoperStart ingelogd={Boolean(user)} />;
}
