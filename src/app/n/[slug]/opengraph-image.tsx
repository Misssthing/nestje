import { ImageResponse } from 'next/og';
import { fotoUrl } from '@/lib/config';
import { aantalKittens, aftelling } from '@/lib/nest';
import { haalNestje } from './data';

export const alt = 'Het nestje';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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

export default async function OgAfbeelding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await haalNestje(slug);

  const titel = data ? `Het nestje van ${data.nest.moeder_naam}` : 'Nestje';
  const a = data ? aftelling(data.nest.geboortedatum, data.nest.verhuisleeftijd_weken) : null;
  const groot = a && a.wekenTeGaan > 0 ? String(a.wekenTeGaan) : '';
  const onder = !a
    ? ''
    : a.wekenTeGaan > 0
      ? `${a.wekenTeGaan === 1 ? 'week' : 'weken'} tot ze mogen verhuizen`
      : 'Ze mogen verhuizen';
  const vrij = data ? data.kittens.filter((k) => k.status === 'vrij').length : 0;
  const regel = data
    ? `${aantalKittens(data.kittens.length)}${data.nest.woonplaats ? ` in ${data.nest.woonplaats}` : ''} · ${vrij} vrij`
    : '';

  // Omslagfoto: eerste nestfoto, anders eerste foto van een vrij kitten, anders van het eerste kitten met foto
  const fotoKitten =
    data?.kittens.find((k) => k.status === 'vrij' && k.fotos.length) ?? data?.kittens.find((k) => k.fotos.length);
  const fotoPad = data?.nestFotos[0] ?? fotoKitten?.fotos[0];
  const foto = fotoPad ? fotoUrl(fotoPad) : null;

  const alleTekst = `${titel}${groot}${onder}${regel}Nestje`;
  const [zwaar, normaal] = await Promise.all([laadLettertype(800, alleTekst), laadLettertype(400, alleTekst)]);
  const fonts = [
    ...(zwaar ? [{ name: 'Bricolage', data: zwaar, weight: 800 as const, style: 'normal' as const }] : []),
    ...(normaal ? [{ name: 'Bricolage', data: normaal, weight: 400 as const, style: 'normal' as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#EEF1EC',
          color: '#1F2A24',
          fontFamily: 'Bricolage',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '64px 56px 56px 72px' }}>
          <div style={{ fontSize: 30, color: '#5E6B63' }}>Nestje</div>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.02, letterSpacing: -1.5, marginTop: 28 }}>
            {titel}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 'auto', gap: 22 }}>
            {groot && (
              <div style={{ fontSize: 190, fontWeight: 800, color: '#E39B3B', lineHeight: 0.8, letterSpacing: -8 }}>
                {groot}
              </div>
            )}
            <div style={{ fontSize: 38, lineHeight: 1.15, maxWidth: 330, paddingBottom: 6 }}>{onder}</div>
          </div>
          <div style={{ fontSize: 28, color: '#5E6B63', marginTop: 26 }}>{regel}</div>
        </div>
        {foto && (
          <div style={{ width: 470, height: '100%', display: 'flex', padding: '40px 40px 40px 0' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto}
              alt=""
              width={430}
              height={550}
              style={{ width: 430, height: 550, objectFit: 'cover', borderRadius: 32 }}
            />
          </div>
        )}
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
