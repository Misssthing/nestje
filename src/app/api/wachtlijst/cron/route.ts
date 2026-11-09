import { NextResponse } from 'next/server';
import { geborenMails, rasMails, rasOnderhoud, verlopenAanbiedingen, volMails } from '@/lib/wachtlijst/acties';

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
  return NextResponse.json({ verlopen, geboren, vol, ras, herinneringen });
}
