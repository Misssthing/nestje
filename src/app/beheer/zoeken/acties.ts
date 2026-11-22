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
