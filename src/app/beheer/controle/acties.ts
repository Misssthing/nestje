'use server';

import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/controle';
import { createClient } from '@/lib/supabase/server';
import { mailAanpassen, mailGoedgekeurd, stuurMail } from '@/lib/wachtlijst/mail';
import { adminClient, isUuid, verkoperEmail } from '@/lib/wachtlijst/server';

async function magControleren() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return isAdmin(data.user?.email);
}

export async function keurGoed(f: FormData) {
  const id = String(f.get('id') ?? '');
  if (!isUuid(id) || !(await magControleren())) return;
  const db = adminClient();
  const { data: nest } = await db
    .from('nests')
    .update({ controle_status: 'goedgekeurd', controle_reden: null, gecontroleerd_op: new Date().toISOString() })
    .eq('id', id)
    .select('id, slug, moeder_naam, owner_id')
    .single<{ id: string; slug: string; moeder_naam: string; owner_id: string }>();
  if (nest) {
    const aan = await verkoperEmail(nest.owner_id);
    if (aan) {
      const m = mailGoedgekeurd({ moeder: nest.moeder_naam, slug: nest.slug, nestId: nest.id });
      await stuurMail(aan, m.onderwerp, m.html);
    }
  }
  revalidatePath('/beheer/controle');
}

export async function keurAf(f: FormData) {
  const id = String(f.get('id') ?? '');
  const reden = String(f.get('reden') ?? '').trim().slice(0, 1000);
  if (!isUuid(id) || !reden || !(await magControleren())) return;
  const db = adminClient();
  const { data: nest } = await db
    .from('nests')
    .update({ controle_status: 'aanpassen', controle_reden: reden, gecontroleerd_op: new Date().toISOString() })
    .eq('id', id)
    .select('id, moeder_naam, owner_id')
    .single<{ id: string; moeder_naam: string; owner_id: string }>();
  if (nest) {
    const aan = await verkoperEmail(nest.owner_id);
    if (aan) {
      const m = mailAanpassen({ moeder: nest.moeder_naam, nestId: nest.id, reden });
      await stuurMail(aan, m.onderwerp, m.html, 'nestje@kattenverzorging.com');
    }
  }
  revalidatePath('/beheer/controle');
}
