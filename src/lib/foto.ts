import { CONFIG } from './config';

async function laadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Terugval voor browsers zonder createImageBitmap-ondersteuning voor dit formaat
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** Verkleint een foto naar max. 1600px aan de langste kant en maakt er een JPEG van. */
export async function verkleinFoto(
  file: File,
  max: number = CONFIG.maxFotoPx,
  kwaliteit: number = CONFIG.fotoKwaliteit,
): Promise<Blob> {
  const bron = await laadBitmap(file);
  const bw = 'naturalWidth' in bron ? bron.naturalWidth : bron.width;
  const bh = 'naturalHeight' in bron ? bron.naturalHeight : bron.height;
  const schaal = Math.min(1, max / Math.max(bw, bh));
  const w = Math.round(bw * schaal);
  const h = Math.round(bh * schaal);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas niet beschikbaar');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bron, 0, 0, w, h);
  if ('close' in bron) bron.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Foto omzetten mislukt'))),
      'image/jpeg',
      kwaliteit,
    ),
  );
}
