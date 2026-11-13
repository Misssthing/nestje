'use server';

import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/controle';
import { naarBrevo, type NieuwsbriefRij } from '@/lib/nieuwsbrief';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/wachtlijst/server';

/** Zet bevestigde adressen die nog niet in Brevo staan alsnog in de Brevo-lijst. */
export async function stuurNaarBrevo() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!isAdmin(data.user?.email)) return;
  const { data: rijen } = await adminClient()
    .from('nieuwsbrief').select('id, email, naam')
    .not('bevestigd_op', 'is', null).is('afgemeld_op', null).is('in_brevo_op', null)
    .limit(200)
    .returns<Pick<NieuwsbriefRij, 'id' | 'email' | 'naam'>[]>();
  for (const r of rijen ?? []) await naarBrevo(r);
  revalidatePath('/beheer/nieuwsbrief');
}
