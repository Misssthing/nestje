import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { KittenMetFotos, Nest, NestFoto, Profiel } from '@/lib/types';
import Beheer from '../Beheer';
import WachtlijstBeheer from '../WachtlijstBeheer';

export const metadata: Metadata = { title: 'Je nestje beheren', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function NestBeheer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // RLS zorgt dat je alleen je eigen nestjes vindt
  const { data: nest } = await supabase.from('nests').select('*').eq('id', id).maybeSingle<Nest>();
  if (!nest) notFound();

  const [{ data: nestFotos }, { data: kittens }, { data: profiel }] = await Promise.all([
    supabase.from('nest_photos').select('*').eq('nest_id', nest.id).order('volgorde').returns<NestFoto[]>(),
    supabase.from('kittens').select('*, kitten_photos(*)').eq('nest_id', nest.id).order('volgorde').returns<KittenMetFotos[]>(),
    supabase.from('profielen').select('*').eq('owner_id', user.id).maybeSingle<Profiel>(),
  ]);

  return (
    <>
      <Beheer nest={nest} nestFotos={nestFotos ?? []} kittens={kittens ?? []} email={user.email ?? ''} profiel={profiel ?? null} />
      {/* Wachtlijst onder het beheer van het nestje (uitbreiding 19) */}
      <div className="wrap" style={{ paddingTop: 0, marginTop: -40 }}>
        <WachtlijstBeheer nestId={nest.id} />
      </div>
    </>
  );
}
