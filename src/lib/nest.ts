import type { Status } from './types';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function aftelling(geboortedatum: string, weken: number, nu = new Date()) {
  const geboren = new Date(`${geboortedatum}T12:00:00`);
  const verhuis = new Date(geboren);
  verhuis.setDate(verhuis.getDate() + weken * 7);
  const leeftijdWeken = Math.max(0, Math.floor((nu.getTime() - geboren.getTime()) / WEEK));
  const wekenTeGaan = Math.max(0, Math.ceil((verhuis.getTime() - nu.getTime()) / WEEK));
  const totaal = verhuis.getTime() - geboren.getTime();
  const voortgang = Math.min(100, Math.max(0, ((nu.getTime() - geboren.getTime()) / totaal) * 100));
  return { geboren, verhuis, leeftijdWeken, wekenTeGaan, voortgang };
}

export const datumNL = (d: Date) =>
  d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' });

export const prijsNL = (p: number) =>
  new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: p % 1 ? 2 : 0,
  }).format(p);

export const STATUS_LABEL: Record<Status, string> = {
  vrij: 'Vrij',
  gereserveerd: 'Gereserveerd',
  verhuisd: 'Verhuisd',
};

export const STATUSSEN: Status[] = ['vrij', 'gereserveerd', 'verhuisd'];

/** 06-12345678, +31 6 1234 5678, 0031... → 31612345678. Ongeldig → null. */
export function normaliseerNummer(invoer: string): string | null {
  let n = invoer.replace(/\D/g, '');
  if (n.startsWith('00')) n = n.slice(2);
  else if (n.startsWith('0')) n = `31${n.slice(1)}`;
  return /^[1-9]\d{7,14}$/.test(n) ? n : null;
}

export function toonNummer(n: string | null) {
  if (!n) return '';
  return n.startsWith('31') ? `0${n.slice(2)}` : `+${n}`;
}

export function aantalKittens(n: number) {
  return `${n} ${n === 1 ? 'kitten' : 'kittens'}`;
}

export const RASSEN = [
  'Huiskat', 'Europese korthaar', 'Kruising', 'Brits korthaar', 'Maine Coon', 'Ragdoll',
  'Noorse boskat', 'Siberische kat', 'Siamees', 'Bengaal', 'Perzisch', 'Sphynx',
];

/** "Ras: Maine Coon" of "Moeder Maine Coon, vader Ragdoll". Leeg als niets is ingevuld. */
export function rasTekst(moeder?: string | null, vader?: string | null) {
  const m = moeder?.trim();
  const v = vader?.trim();
  if (m && v && m.toLowerCase() !== v.toLowerCase()) return `Moeder ${m}, vader ${v}`;
  if (m || v) return `Ras: ${m || v}`;
  return '';
}
