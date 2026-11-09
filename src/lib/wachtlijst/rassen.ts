import { RASSEN } from '@/lib/nest';

/** Rassen waarvoor je je op de raslijst kunt zetten: alles behalve huiskat en kruising (alleen nestjes met stamboom). */
export const RASLIJST_RASSEN = RASSEN.filter((r) => !['huiskat', 'kruising'].includes(r.toLowerCase()));
