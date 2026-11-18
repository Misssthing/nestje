import { NextResponse } from 'next/server';
import { adminClient, isUuid } from '@/lib/wachtlijst/server';

export const dynamic = 'force-dynamic';

/**
 * Geeft of trekt een hartje in bij een kitten (uitbreiding 34). Zonder inloggen: de browser
 * onthoudt zelf (in localStorage) welke kittens iemand al een hartje gaf, zie Hartknop.
 * Niet waterdicht tegen misbruik (localStorage wissen omzeilt het), maar dat is geen probleem
 * voor dit speelse, niet-kritieke tellertje.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ hartjes: null }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { actie?: string };
  const delta = body.actie === 'intrekken' ? -1 : 1;

  const db = adminClient();
  const { data, error } = await db.rpc('wijzig_kitten_hartjes', { p_kitten_id: id, p_delta: delta });
  if (error) return NextResponse.json({ hartjes: null }, { status: 500 });

  return NextResponse.json({ hartjes: data as number });
}
