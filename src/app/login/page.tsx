import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import VerkoperStart from '@/components/VerkoperStart';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Inloggen of je nestjespagina maken', robots: { index: false } };

export default async function LoginPagina({ searchParams }: { searchParams: Promise<{ fout?: string; terug?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/beheer');
  const { fout, terug } = await searchParams;
  return <VerkoperStart fout={Boolean(fout)} terugkerend={Boolean(terug)} />;
}
