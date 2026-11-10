import type { Metadata } from 'next';
import VerkoperStart from '@/components/VerkoperStart';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Kittens verkopen? Maak gratis je nestjespagina',
  description:
    'Maak in een minuut een mooie pagina voor je nestje kittens en deel hem via WhatsApp en Facebook. Gratis, zonder wachtwoord.',
  alternates: { canonical: '/verkopen' },
};

export default async function Verkopen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <VerkoperStart ingelogd={Boolean(user)} />;
}
