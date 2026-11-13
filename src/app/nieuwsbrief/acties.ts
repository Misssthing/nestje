'use server';

import { redirect } from 'next/navigation';
import { afmeldenNieuwsbrief, bevestigNieuwsbrief } from '@/lib/nieuwsbrief';
import { isUuid } from '@/lib/wachtlijst/server';

/** Bevestigen gaat met een knop op de pagina, zodat virusscanners in mailprogramma's niets per ongeluk bevestigen. */
export async function bevestig(f: FormData) {
  const token = String(f.get('token') ?? '');
  if (!isUuid(token)) return;
  await bevestigNieuwsbrief(token);
  redirect(`/nieuwsbrief/${token}?bevestigd=1`);
}

export async function afmelden(f: FormData) {
  const token = String(f.get('token') ?? '');
  if (!isUuid(token)) return;
  await afmeldenNieuwsbrief(token);
  redirect(`/nieuwsbrief/${token}?afgemeld=1`);
}
