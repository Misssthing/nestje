import { RASSEN } from '@/lib/nest';

/** Rassen waarvoor je je op de raslijst kunt zetten: alles behalve huiskat en kruising (alleen nestjes met stamboom). */
export const RASLIJST_RASSEN = RASSEN.filter((r) => !['huiskat', 'kruising'].includes(r.toLowerCase()));

/** Sentinel-waarde: "maakt niet uit welk ras, mail me bij elk nieuw nestje met stamboom". */
export const ALLE_RASSEN = 'Alle rassen';

/** Nette Nederlandse opsomming ("X", "X en Y", "X, Y en Z"), of 'elk ras' als ALLE_RASSEN is gekozen. */
export function rassenOpsomming(rassen: string[]): string {
  if (rassen.includes(ALLE_RASSEN)) return 'elk ras';
  if (rassen.length <= 1) return rassen[0] ?? '';
  return `${rassen.slice(0, -1).join(', ')} en ${rassen[rassen.length - 1]}`;
}
