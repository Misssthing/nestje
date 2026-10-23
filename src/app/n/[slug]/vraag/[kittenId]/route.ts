import { NextResponse, type NextRequest } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';

const UUID = /^[0-9a-f-]{36}$/i;

/** Stuurt door naar WhatsApp. Het nummer staat zo nooit in de HTML van de pagina. */
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

  const tekst = `Hoi! Ik zag het nestje van ${data.moeder_naam} op Nestje. Is ${data.kitten_naam} nog beschikbaar?`;
  const res = NextResponse.redirect(`https://wa.me/${data.nummer}?text=${encodeURIComponent(tekst)}`, 302);
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
