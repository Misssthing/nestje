import { NextResponse, type NextRequest } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';

/** Interesse in een verwacht nestje: stuurt door naar WhatsApp, zonder het nummer in de pagina te zetten. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const terug = new URL(`/n/${slug}`, request.url);
  if (!/^[a-z0-9-]{4,40}$/.test(slug)) return NextResponse.redirect(terug);

  const { data } = await createPublicClient()
    .rpc('whatsapp_interesse', { p_slug: slug })
    .maybeSingle<{ nummer: string; moeder_naam: string }>();

  if (!data?.nummer) return NextResponse.redirect(terug);

  const tekst = `Hoi! Ik zag op Nestje dat er binnenkort kittens van ${data.moeder_naam} worden verwacht. Ik heb interesse, kun je me op de hoogte houden?`;
  const res = NextResponse.redirect(`https://wa.me/${data.nummer}?text=${encodeURIComponent(tekst)}`, 302);
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
