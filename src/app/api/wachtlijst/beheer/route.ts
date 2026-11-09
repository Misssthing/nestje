import { NextResponse } from 'next/server';
import { aanbieden, doorschuiven, haalNest, intrekken, nestIsOpen, verlopenAanbiedingen, verwijderen, type WachtRij } from '@/lib/wachtlijst/acties';
import { createClient } from '@/lib/supabase/server';
import { adminClient, isUuid } from '@/lib/wachtlijst/server';

/** Ingelogde verkoper, via dezelfde inlogcookies als de rest van het beheer. */
async function verkoper() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export const dynamic = 'force-dynamic';

const nee = (melding: string, status = 400) => NextResponse.json({ fout: melding }, { status });

/** Wachtlijst van één nestje, voor de verkoper. */
export async function GET(req: Request) {
  const user = await verkoper();
  if (!user) return nee('Log opnieuw in.', 401);
  const nestId = new URL(req.url).searchParams.get('nest') ?? '';
  if (!isUuid(nestId)) return nee('Onbekend nestje.');
  const nest = await haalNest(nestId);
  if (!nest || nest.owner_id !== user.id) return nee('Dit nestje is niet van jou.', 403);

  await verlopenAanbiedingen([nest.id]);
  const db = adminClient();
  const [{ data: rijen }, { data: kittens }, { data: nesten }] = await Promise.all([
    db.from('wachtlijst')
      .select('id, naam, email, woonplaats, voorkeur_geslacht, voorkeur_vacht, motivatie, aangemeld_op, status, kitten_id, aanbod_verloopt_op, geweigerd_aantal, via_ras_id')
      .eq('nest_id', nest.id).neq('status', 'afgemeld').order('aangemeld_op'),
    db.from('kittens').select('id, naam, geslacht, status').eq('nest_id', nest.id).order('volgorde'),
    db.from('nests').select('id, slug, moeder_naam, geboortedatum, verhuisleeftijd_weken, afgerond, verborgen, owner_id, moeder_ras, vader_ras, stamboom')
      .eq('owner_id', user.id).neq('id', nest.id).eq('afgerond', false),
  ]);
  const anderen = [];
  for (const n of nesten ?? []) if (await nestIsOpen(n)) anderen.push({ id: n.id, moeder_naam: n.moeder_naam });
  return NextResponse.json({ rijen: (rijen ?? []) as Partial<WachtRij>[], kittens: kittens ?? [], anderen });
}

/** Acties van de verkoper: aanbieden, intrekken, doorschuiven, verwijderen. */
export async function POST(req: Request) {
  const user = await verkoper();
  if (!user) return nee('Log opnieuw in.', 401);
  const body = await req.json().catch(() => ({}));
  const { actie, rijId, kittenId, naarNestId } = body as Record<string, string>;
  if (!isUuid(rijId ?? '')) return nee('Onbekende aanmelding.');

  let r: { ok?: boolean; fout?: string };
  if (actie === 'aanbieden' && isUuid(kittenId ?? '')) r = await aanbieden(rijId, kittenId, user.id);
  else if (actie === 'intrekken') r = await intrekken(rijId, user.id);
  else if (actie === 'doorschuiven' && isUuid(naarNestId ?? '')) r = await doorschuiven(rijId, naarNestId, user.id);
  else if (actie === 'verwijderen') r = await verwijderen(rijId, user.id);
  else return nee('Onbekende actie.');

  return r.fout ? nee(r.fout) : NextResponse.json({ ok: true });
}
