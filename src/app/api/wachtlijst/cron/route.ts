import { NextResponse } from 'next/server';
import { ADMIN_EMAIL } from '@/lib/controle';
import { geborenMails, rasMails, rasOnderhoud, verlopenAanbiedingen, volMails } from '@/lib/wachtlijst/acties';
import { mailAdminControle, stuurMail } from '@/lib/wachtlijst/mail';
import { adminClient } from '@/lib/wachtlijst/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Dagelijkse taken van de wachtlijst. Vercel roept deze route elke ochtend aan (zie vercel.json)
 * en stuurt dan automatisch "Authorization: Bearer <CRON_SECRET>" mee.
 */
export async function GET(req: Request) {
  const geheim = process.env.CRON_SECRET;
  if (!geheim || req.headers.get('authorization') !== `Bearer ${geheim}`) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 401 });
  }
  const verlopen = await verlopenAanbiedingen();
  const geboren = await geborenMails();
  const vol = await volMails();
  const ras = await rasMails();
  const herinneringen = await rasOnderhoud();

  // Overzicht voor de beheerder: hoeveel nestjes wachten op controle
  const { count } = await adminClient()
    .from('nests').select('id', { count: 'exact', head: true })
    .eq('controle_status', 'wacht').eq('in_overzicht', true).eq('afgerond', false);
  if (count) {
    const m = mailAdminControle({ aantal: count });
    await stuurMail(ADMIN_EMAIL, m.onderwerp, m.html);
  }
  return NextResponse.json({ verlopen, geboren, vol, ras, herinneringen, controle: count ?? 0 });
}
