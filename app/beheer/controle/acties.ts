'use server';

import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/controle';
import { createClient } from '@/lib/supabase/server';
import { mailAanpassen, mailGoedgekeurd, mailUitslagKloptNiet, stuurMail } from '@/lib/wachtlijst/mail';
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

/** Cattery nagekeken (of weer intrekken). Geldt voor deze verkoper met deze catterynaam. */
export async function zetCattery(f: FormData) {
  const owner = String(f.get('owner_id') ?? '');
  const cattery = String(f.get('cattery') ?? '').trim();
  const aan = f.get('aan') === '1';
  if (!isUuid(owner) || !cattery || !(await magControleren())) return;
  const db = adminClient();
  if (aan) {
    await db.from('catteries_gecontroleerd').upsert({ owner_id: owner, cattery, gecontroleerd_op: new Date().toISOString() });
  } else {
    await db.from('catteries_gecontroleerd').delete().eq('owner_id', owner);
  }
  revalidatePath('/beheer/controle');
}

type Test = { test: string; bewijs?: string; status?: string; bekeken_op?: string; beoordeeld?: string };

/** Testuitslag bekeken: klopt of klopt niet. Daarna wordt het bestand meteen verwijderd. */
export async function beoordeelUitslag(f: FormData) {
  const id = String(f.get('id') ?? '');
  const ouder = f.get('ouder') === 'vader' ? 'vader' : 'moeder';
  const pad = String(f.get('pad') ?? '');
  const klopt = f.get('oordeel') === 'klopt';
  const reden = String(f.get('reden') ?? '').trim().slice(0, 500);
  if (!isUuid(id) || !pad.startsWith(`${id}/`) || !(await magControleren())) return;
  const db = adminClient();
  const kolom = ouder === 'vader' ? 'vader_testen' : 'moeder_testen';
  const { data: nest } = await db
    .from('nests')
    .select(`id, moeder_naam, owner_id, ${kolom}`)
    .eq('id', id)
    .single<{ id: string; moeder_naam: string; owner_id: string } & Record<string, Test[] | null>>();
  if (!nest) return;
  const testen = (nest[kolom] ?? []) as Test[];
  const doel = testen.find((t) => t.bewijs === pad);
  if (doel) {
    const nieuw = testen.map((t) => {
      if (t !== doel) return t;
      const { bewijs, ...rest } = t;
      return { ...rest, status: klopt ? 'bekeken' : 'afgekeurd', bekeken_op: new Date().toISOString().slice(0, 10), beoordeeld: bewijs };
    });
    await db.from('nests').update({ [kolom]: nieuw }).eq('id', id);
    if (!klopt) {
      const aan = await verkoperEmail(nest.owner_id);
      if (aan) {
        const m = mailUitslagKloptNiet({ moeder: nest.moeder_naam, nestId: nest.id, test: doel.test, ouder, reden });
        await stuurMail(aan, m.onderwerp, m.html, 'nestje@kattenverzorging.com');
      }
    }
  }
  await db.storage.from('testuitslagen').remove([pad]);
  revalidatePath('/beheer/controle');
}
