import { NextResponse, type NextRequest } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Stuurt door naar WhatsApp. Het nummer staat zo nooit in de HTML van de pagina.
 * Verplaatst hierheen vanaf /vraag/[kittenId]/route.ts (uitbreiding 39): die plek is nu een
 * pagina met een kort "vertel iets over jezelf"-formuliertje, dat via GET hierheen doorstuurt.
 * Een eventuele toelichting komt mee in de querystring en wordt aan het WhatsApp-bericht geplakt.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; kittenId: string }> },
) {
  const { slug, kittenId } = await params;
  const terug = new URL(`/n/${slug}`, request.url);

  if (!/^[a-z0-9-]{4,40}$/.test(slug) || !UUID.test(kittenId)) {
    return NextResponse.redirect(terug);
  }

  const { data } = await createPublicClient()
    .rpc('whatsapp_gegevens', { p_slug: slug, p_kitten: kittenId })
    .maybeSingle<{ nummer: string; moeder_naam: string; kitten_naam: string }>();

  if (!data?.nummer) return NextResponse.redirect(terug);

  const toelichting = request.nextUrl.searchParams.get('toelichting')?.trim().slice(0, 300) ?? '';
  const heeftKatten = request.nextUrl.searchParams.get('heeft_katten');
  const basis = `Hoi! Ik zag het nestje van ${data.moeder_naam} op Nestje. Is ${data.kitten_naam} nog beschikbaar?`;
  const katten = heeftKatten === 'ja' ? ' Ik heb zelf al katten.' : heeftKatten === 'nee' ? ' Ik heb zelf nog geen katten.' : '';
  const tekst = `${basis}${katten}${toelichting ? ` ${toelichting}` : ''}`;
  const res = NextResponse.redirect(`https://wa.me/${data.nummer}?text=${encodeURIComponent(tekst)}`, 302);
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
