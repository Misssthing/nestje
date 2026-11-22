import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import VerkoperStart from '@/components/VerkoperStart';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Inloggen of je nestjespagina maken', robots: { index: false } };

export default async function LoginPagina({ searchParams }: { searchParams: Promise<{ fout?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/beheer');
  const { fout } = await searchParams;
  return <VerkoperStart fout={Boolean(fout)} />;
}
