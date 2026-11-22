import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

/**
 * Dagelijks aangeroepen door Vercel Cron (zie vercel.json).
 * Eén kleine leesvraag aan de database, zodat Supabase het gratis project niet pauzeert.
 */
export async function GET() {
  const { error } = await createPublicClient().from('openbare_nesten').select('id').limit(1);
  return NextResponse.json(
    { ok: !error, tijd: new Date().toISOString() },
    { status: error ? 500 : 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
