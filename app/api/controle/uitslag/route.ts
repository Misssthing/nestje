import { NextResponse } from 'next/server';
import { ADMIN_EMAIL } from '@/lib/controle';
import { createClient } from '@/lib/supabase/server';
import type { TestMetBewijs } from '@/lib/testen';
import { mailAdminUitslag, stuurMail } from '@/lib/wachtlijst/mail';
import { isUuid } from '@/lib/wachtlijst/server';

/** Een verkoper heeft een testuitslag geüpload: stuur Nestje een seintje. */
export async function POST(req: Request) {
  const { nestId } = (await req.json().catch(() => ({}))) as { nestId?: string };
  if (!nestId || !isUuid(nestId)) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // Het opslaan van het formulier gebeurt vlak na de upload; even wachten zodat de uitslag erin staat
  await new Promise((r) => setTimeout(r, 2500));
  const { data: nest } = await supabase
    .from('nests')
    .select('slug, moeder_naam, owner_id, moeder_testen, vader_testen')
    .eq('id', nestId)
    .maybeSingle<{ slug: string; moeder_naam: string; owner_id: string; moeder_testen: TestMetBewijs[] | null; vader_testen: TestMetBewijs[] | null }>();
  if (!nest || nest.owner_id !== user.id) return NextResponse.json({ ok: false }, { status: 404 });

  const aantal = [...(nest.moeder_testen ?? []), ...(nest.vader_testen ?? [])].filter((t) => t.status === 'wacht').length;
  if (aantal > 0) {
    const m = mailAdminUitslag({ moeder: nest.moeder_naam, slug: nest.slug, aantal, verkoper: user.email ?? '' });
    await stuurMail(ADMIN_EMAIL, m.onderwerp, m.html);
  }
  return NextResponse.json({ ok: true });
}
