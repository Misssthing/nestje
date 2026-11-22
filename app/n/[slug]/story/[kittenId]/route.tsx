import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { fotoUrl } from '@/lib/config';
import { aftelling } from '@/lib/nest';
import { haalNestje } from '../../data';

/**
 * Story-afbeelding (1080×1920) per kitten, voor een nestupdate op Instagram of TikTok.
 * Bewust zonder prijs, zonder “te koop” en zonder telefoonnummer: het is een update, geen advertentie.
 */
const BREED = 1080;
const HOOG = 1920;

async function laadLettertype(gewicht: number, tekst: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@${gewicht}&text=${encodeURIComponent(tekst)}`,
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

function bestandsnaam(t: string) {
  return (
    t
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'kitten'
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string; kittenId: string }> }) {
  const { slug, kittenId } = await params;
  const data = await haalNestje(slug);
  const kitten = data?.kittens.find((k) => k.id === kittenId);
  if (!data || !kitten) return new Response('Niet gevonden', { status: 404 });

  const a = aftelling(data.nest.geboortedatum, data.nest.verhuisleeftijd_weken);
  const groot = a.wekenTeGaan > 0 ? String(a.wekenTeGaan) : '';
  const onder =
    a.wekenTeGaan > 0
      ? `${a.wekenTeGaan === 1 ? 'week' : 'weken'} tot ik mag verhuizen`
      : 'Ik ben klaar om te verhuizen';
  const kenmerken = [kitten.geslacht === 'kater' ? 'Kater' : kitten.geslacht === 'poes' ? 'Poes' : '', kitten.vacht ?? '']
    .filter(Boolean)
    .join(' · ');
  const nestRegel = `Uit het nestje van ${data.nest.moeder_naam}`;
  const fotoPad = kitten.fotos[0] ?? data.nestFotos[0];
  const foto = fotoPad ? fotoUrl(fotoPad) : null;

  const alleTekst = `Nestje-update${kitten.naam}${kenmerken}${groot}${onder}${nestRegel}nestje.kattenverzorging.com`;
  const [zwaar, normaal] = await Promise.all([laadLettertype(800, alleTekst), laadLettertype(400, alleTekst)]);
  const fonts = [
    ...(zwaar ? [{ name: 'Bricolage', data: zwaar, weight: 800 as const, style: 'normal' as const }] : []),
    ...(normaal ? [{ name: 'Bricolage', data: normaal, weight: 400 as const, style: 'normal' as const }] : []),
  ];

  const downloaden = request.nextUrl.searchParams.get('download') === '1';
  const naam = `nestje-${bestandsnaam(kitten.naam)}.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#EEF1EC',
          color: '#1F2A24',
          fontFamily: 'Bricolage',
        }}
      >
        {/* Foto bovenaan, met daarover het labeltje */}
        <div style={{ width: BREED, height: 1160, display: 'flex', position: 'relative', background: '#DDE3DA' }}>
          {foto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt="" width={BREED} height={1160} style={{ width: BREED, height: 1160, objectFit: 'cover' }} />
          )}
          <div
            style={{
              position: 'absolute',
              top: 230,
              left: 64,
              display: 'flex',
              background: '#FFFFFF',
              color: '#3F7A55',
              fontSize: 34,
              fontWeight: 800,
              padding: '14px 30px',
              borderRadius: 999,
            }}
          >
            Nestje-update
          </div>
        </div>

        {/* Tekst; onderaan blijft ruimte vrij voor de knoppen van Instagram en TikTok */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '56px 72px 0' }}>
          <div style={{ fontSize: 124, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>{kitten.naam}</div>
          {kenmerken && <div style={{ fontSize: 38, color: '#5E6B63', marginTop: 14 }}>{kenmerken}</div>}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, marginTop: 44 }}>
            {groot && (
              <div style={{ fontSize: 190, fontWeight: 800, color: '#E39B3B', lineHeight: 0.8, letterSpacing: -6 }}>
                {groot}
              </div>
            )}
            <div style={{ fontSize: 44, lineHeight: 1.12, maxWidth: 560, paddingBottom: 4 }}>{onder}</div>
          </div>
          <div style={{ fontSize: 32, color: '#5E6B63', marginTop: 40 }}>{nestRegel}</div>
          <div style={{ fontSize: 28, color: '#5E6B63', marginTop: 10 }}>nestje.kattenverzorging.com</div>
        </div>
      </div>
    ),
    {
      width: BREED,
      height: HOOG,
      fonts: fonts.length ? fonts : undefined,
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
        ...(downloaden ? { 'Content-Disposition': `attachment; filename="${naam}"` } : {}),
      },
    },
  );
}
