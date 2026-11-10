import { NextResponse } from 'next/server';
import { fotoUrl } from '@/lib/config';
import { ADMIN_EMAIL } from '@/lib/controle';
import { rasTekst } from '@/lib/nest';
import { createClient } from '@/lib/supabase/server';
import { mailAdminNieuwNestje, stuurMail } from '@/lib/wachtlijst/mail';
import { adminClient, isUuid, verkoperEmail } from '@/lib/wachtlijst/server';

export const dynamic = 'force-dynamic';

/**
 * Het beheer roept dit aan na het opslaan. Staat het nestje klaar voor controle en is dat nog niet gemeld,
 * dan krijgt de beheerder direct een mail. Meerdere keren aanroepen is geen probleem: er gaat maar één mail uit.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ gemeld: false }, { status: 401 });
  const { nestId } = (await req.json().catch(() => ({}))) as { nestId?: string };
  if (!nestId || !isUuid(nestId)) return NextResponse.json({ gemeld: false }, { status: 400 });

  const db = adminClient();
  const { data: n } = await db
    .from('nests')
    .select('id, owner_id, slug, moeder_naam, woonplaats, provincie, moeder_ras, vader_ras, stamboom, soort, moeder_foto, in_overzicht, afgerond, controle_status, ter_controle_op, controle_gemeld_op')
    .eq('id', nestId)
    .maybeSingle();
  if (!n || n.owner_id !== auth.user.id) return NextResponse.json({ gemeld: false }, { status: 403 });

  const klaar =
    n.controle_status === 'wacht' && n.in_overzicht && n.provincie && !n.afgerond && (n.soort === 'vondeling' || n.moeder_foto);
  const alGemeld = n.controle_gemeld_op && (!n.ter_controle_op || n.controle_gemeld_op >= n.ter_controle_op);
  if (!klaar || alGemeld) return NextResponse.json({ gemeld: false });

  // Eerst vastleggen (voorkomt dubbele mails als het beheer twee keer kort na elkaar aanroept)
  const nu = new Date().toISOString();
  let q = db.from('nests').update({ controle_gemeld_op: nu }).eq('id', n.id);
  q = n.controle_gemeld_op ? q.eq('controle_gemeld_op', n.controle_gemeld_op) : q.is('controle_gemeld_op', null);
  const { data: vast } = await q.select('id');
  if (!vast?.length) return NextResponse.json({ gemeld: false });

  const m = mailAdminNieuwNestje({
    moeder: n.moeder_naam,
    slug: n.slug,
    plaats: [n.woonplaats, n.provincie].filter(Boolean).join(', '),
    ras: (rasTekst(n.moeder_ras, n.vader_ras) || 'Geen ras ingevuld') + (n.stamboom ? ', met stamboom' : ''),
    vondeling: n.soort === 'vondeling',
    foto: n.moeder_foto ? fotoUrl(n.moeder_foto) : null,
    verkoper: (await verkoperEmail(n.owner_id)) ?? auth.user.email ?? 'onbekend',
    opnieuw: Boolean(n.controle_gemeld_op),
  });
  await stuurMail(ADMIN_EMAIL, m.onderwerp, m.html);
  return NextResponse.json({ gemeld: true });
}
