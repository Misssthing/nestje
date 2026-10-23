import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { KittenMetFotos, Nest, NestFoto } from '@/lib/types';
import Beheer from './Beheer';
import NieuwNestje from './NieuwNestje';

export const metadata: Metadata = { title: 'Je nestje beheren', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function BeheerPagina() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: nest } = await supabase.from('nests').select('*').maybeSingle<Nest>();

  if (!nest) return <NieuwNestje />;

  const { data: nestFotos } = await supabase
    .from('nest_photos')
    .select('*')
    .eq('nest_id', nest.id)
    .order('volgorde')
    .returns<NestFoto[]>();

  const { data: kittens } = await supabase
    .from('kittens')
    .select('*, kitten_photos(*)')
    .eq('nest_id', nest.id)
    .order('volgorde')
    .returns<KittenMetFotos[]>();

  return <Beheer nest={nest} nestFotos={nestFotos ?? []} kittens={kittens ?? []} email={user.email ?? ''} />;
}
