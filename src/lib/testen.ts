import type { OuderTest } from '@/lib/nest';

/** Een test van een ouder, met eventueel een registerlink en een bewijs dat Nestje bekijkt. */
export type TestMetBewijs = OuderTest & {
  /** Link naar een openbaar register, zoals PawPeds */
  link?: string;
  /** Pad van de geüploade uitslag in de bucket "testuitslagen" (alleen zichtbaar voor Nestje) */
  bewijs?: string;
  /** wacht = Nestje moet nog kijken, bekeken = klopt, afgekeurd = klopte niet */
  status?: 'wacht' | 'bekeken' | 'afgekeurd';
  bekeken_op?: string;
  /** Pad van het bestand dat al bekeken en verwijderd is */
  beoordeeld?: string;
};

export const UITSLAG_BUCKET = 'testuitslagen';
export const MAX_PDF = 5 * 1024 * 1024;

/** Alleen echte webadressen tonen. */
export function veiligeLink(link?: string | null) {
  const l = (link ?? '').trim();
  if (!l) return '';
  try {
    const u = new URL(/^https?:\/\//i.test(l) ? l : `https://${l}`);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : '';
  } catch {
    return '';
  }
}

/** Korte naam van het register voor de knop: "Bekijk in PawPeds". */
export function registerNaam(link: string) {
  try {
    const host = new URL(link).hostname.replace(/^www\./, '');
    if (host.includes('pawpeds')) return 'PawPeds';
    if (host.includes('ofa.org')) return 'OFA';
    if (host.includes('felikat')) return 'Felikat';
    if (host.includes('tica')) return 'TICA';
    if (host.includes('fifeweb')) return 'FIFe';
    return 'register';
  } catch {
    return 'register';
  }
}

/** Ouder heeft minstens één test die Nestje heeft bekeken. */
export const heeftBekekenTest = (t: TestMetBewijs[]) => t.some((x) => x.status === 'bekeken');

/** Maakt een foto kleiner (max 1600 px, JPEG), zodat een uitslag een paar honderd kB is in plaats van megabytes. */
export async function verkleinFoto(bestand: File): Promise<Blob> {
  const bitmap = await createImageBitmap(bestand);
  const schaal = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * schaal);
  canvas.height = Math.round(bitmap.height * schaal);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return new Promise((ok, fout) => canvas.toBlob((b) => (b ? ok(b) : fout(new Error('blob'))), 'image/jpeg', 0.82));
}
