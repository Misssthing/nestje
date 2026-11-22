'use server';

import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/controle';
import { createClient } from '@/lib/supabase/server';
import { adminClient, isUuid } from '@/lib/wachtlijst/server';

/** Verwijdert een willekeurig nestje (ook van een andere verkoper). Alleen voor de beheerder. */
export async function verwijderNestje(f: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!isAdmin(auth.user?.email)) redirect('/beheer');

  const id = String(f.get('id') ?? '');
  const q = String(f.get('q') ?? '');
  if (isUuid(id)) {
    // on delete cascade ruimt kittens, foto's en wachtlijst-aanmeldingen van dit nestje vanzelf mee op.
    await adminClient().from('nests').delete().eq('id', id);
  }
  redirect(`/beheer/zoeken?q=${encodeURIComponent(q)}&verwijderd=1`);
}

/**
 * Nestje verbergen of weer online zetten. Verbergen zet de hele pagina offline (ook de eigen link),
 * niet alleen uit het overzicht — voor gevallen zoals verdachte of AI-gegenereerde foto's.
 * Omkeerbaar: hetzelfde knopje zet 'm later weer online. Alleen voor de beheerder.
 */
export async function wisselVerborgen(f: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!isAdmin(auth.user?.email)) redirect('/beheer');

  const id = String(f.get('id') ?? '');
  const q = String(f.get('q') ?? '');
  const verborgen = f.get('verborgen') === '1';
  if (isUuid(id)) {
    await adminClient().from('nests').update({ verborgen }).eq('id', id);
  }
  redirect(`/beheer/zoeken?q=${encodeURIComponent(q)}&${verborgen ? 'verborgen=1' : 'teruggezet=1'}`);
}
