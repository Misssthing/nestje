import { NextResponse } from 'next/server';
import { fotoUrl } from '@/lib/config';
import { ADMIN_EMAIL } from '@/lib/controle';
import { rasTekst } from '@/lib/nest';
import { createClient } from '@/lib/supabase/server';
import { mailAdminNieuwNestje, mailAdminNieuwNestjeLink, stuurMail } from '@/lib/wachtlijst/mail';
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
    .select(
      'id, owner_id, slug, moeder_naam, woonplaats, provincie, moeder_ras, vader_ras, stamboom, soort, moeder_foto, in_overzicht, afgerond, controle_status, ter_controle_op, controle_gemeld_op, nieuw_gemeld_op',
    )
    .eq('id', nestId)
    .maybeSingle();
  if (!n || n.owner_id !== auth.user.id) return NextResponse.json({ gemeld: false }, { status: 403 });

  // Het allereerste nestje van een account (nog geen ander nestje op die naam) moet altijd langs de
  // echte controle, ook als de verkoper niet voor het overzicht kiest: anders zou de pagina (die
  // zonder overzicht-keuze meteen live gaat) nooit door Nestje bekeken worden.
  const { count: andereNestjes } = await db.from('nests').select('id', { count: 'exact', head: true }).eq('owner_id', n.owner_id).neq('id', n.id);
  const eersteNestje = (andereNestjes ?? 0) === 0;

  const basisKlaar = !n.afgerond && (n.soort === 'vondeling' || n.moeder_foto);
  const klaar = n.controle_status === 'wacht' && basisKlaar && (eersteNestje || (n.in_overzicht && n.provincie));
  const alGemeld = n.controle_gemeld_op && (!n.ter_controle_op || n.controle_gemeld_op >= n.ter_controle_op);
  const nu = new Date().toISOString();

  if (klaar && !alGemeld) {
    // Eerst vastleggen (voorkomt dubbele mails als het beheer twee keer kort na elkaar aanroept)
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
      eersteNestje,
    });
    await stuurMail(ADMIN_EMAIL, m.onderwerp, m.html);
    return NextResponse.json({ gemeld: true });
  }

  // Nestje gekozen als alleen een deelbare link (niet in het overzicht): komt normaal nooit in de echte
  // controle, de pagina staat al online. Puur ter info, één keer per nestje, geen actie nodig. (Bij het
  // allereerste nestje van een account is dit niet van toepassing: dat loopt altijd via de echte controle
  // hierboven, want de pagina staat dan juist nog niet online.)
  if (!eersteNestje && !n.in_overzicht && basisKlaar && !n.nieuw_gemeld_op) {
    const { data: vast2 } = await db.from('nests').update({ nieuw_gemeld_op: nu }).eq('id', n.id).is('nieuw_gemeld_op', null).select('id');
    if (!vast2?.length) return NextResponse.json({ gemeld: false });

    const m2 = mailAdminNieuwNestjeLink({
      moeder: n.moeder_naam,
      slug: n.slug,
      plaats: [n.woonplaats, n.provincie].filter(Boolean).join(', '),
      ras: (rasTekst(n.moeder_ras, n.vader_ras) || 'Geen ras ingevuld') + (n.stamboom ? ', met stamboom' : ''),
      vondeling: n.soort === 'vondeling',
      foto: n.moeder_foto ? fotoUrl(n.moeder_foto) : null,
      verkoper: (await verkoperEmail(n.owner_id)) ?? auth.user.email ?? 'onbekend',
    });
    await stuurMail(ADMIN_EMAIL, m2.onderwerp, m2.html);
    return NextResponse.json({ gemeld: true });
  }

  return NextResponse.json({ gemeld: false });
}
