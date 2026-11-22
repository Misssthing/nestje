import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminClient } from '@/lib/wachtlijst/server';

export const dynamic = 'force-dynamic';

/**
 * Telt een bezoek aan de openbare nestjespagina mee, voor de verkoper (uitbreiding 34).
 * Wordt alleen aangeroepen vanuit de browser (zie Weergaveteller), dus linkpreview-bots
 * (WhatsApp, Facebook, Google) die de pagina zonder JavaScript ophalen, tellen niet mee.
 * Per bezoeker en nestje maar één keer per dag, via een cookie.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{4,40}$/.test(slug)) return NextResponse.json({ geteld: false }, { status: 400 });

  const cookieNaam = `bekeken_${slug}`;
  const cookieStore = await cookies();
  if (cookieStore.get(cookieNaam)) return NextResponse.json({ geteld: false });

  const db = adminClient();
  const { data: nest } = await db.from('nests').select('id').eq('slug', slug).maybeSingle();
  if (!nest) return NextResponse.json({ geteld: false }, { status: 404 });

  await db.rpc('tel_nest_weergave', { p_nest_id: nest.id });

  const res = NextResponse.json({ geteld: true });
  res.cookies.set(cookieNaam, '1', { maxAge: 60 * 60 * 24, httpOnly: true, sameSite: 'lax', path: '/' });
  return res;
}
