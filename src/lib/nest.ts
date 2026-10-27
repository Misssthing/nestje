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
  // Ligt de geboortedatum in de toekomst, dan is het een verwacht nestje (uitgerekende datum).
  const vandaag = vandaagISO(nu);
  const dagenTotGeboorte = Math.max(
    0,
    Math.round((Date.parse(`${geboortedatum}T00:00:00Z`) - Date.parse(`${vandaag}T00:00:00Z`)) / (24 * 60 * 60 * 1000)),
  );
  const verwacht = dagenTotGeboorte > 0;
  return { geboren, verhuis, leeftijdWeken, wekenTeGaan, voortgang, verwacht, dagenTotGeboorte };
}

/** Vandaag als JJJJ-MM-DD in Nederlandse tijd */
export function vandaagISO(nu = new Date()) {
  return nu.toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });
}

/** Hoe ver vooruit een uitgerekende datum mag liggen */
export const MAX_DAGEN_VOORUIT = 100;

export const dagen = (n: number) => `${n} ${n === 1 ? 'dag' : 'dagen'}`;

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
  optie: 'Optie',
  gereserveerd: 'Gereserveerd',
  verhuisd: 'Verhuisd',
};

export const STATUSSEN: Status[] = ['vrij', 'optie', 'gereserveerd', 'verhuisd'];

/** Labels zoals kopers ze zien op de openbare pagina */
export const STATUS_PUBLIEK: Record<Status, string> = {
  vrij: 'Vrij',
  optie: 'Onder optie',
  gereserveerd: 'Gereserveerd',
  verhuisd: 'Verhuisd',
};

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

export const PROVINCIES = [
  'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg',
  'Noord-Brabant', 'Noord-Holland', 'Overijssel', 'Utrecht', 'Zeeland', 'Zuid-Holland', 'België',
] as const;

export const RASSEN = [
  'Huiskat', 'Kruising', 'Europese korthaar', 'Brits korthaar', 'Brits langhaar', 'Maine Coon', 'Ragdoll',
  'Noorse boskat', 'Siberische kat', 'Bengaal', 'Perzisch', 'Exotic', 'Siamees', 'Oosterse korthaar',
  'Abessijn', 'Somali', 'Heilige Birmaan', 'Russisch blauw', 'Devon rex', 'Burmees',
];

/** Deze mag je zonder stamboom gebruiken; elke andere rasnaam alleen met stamboom. */
export const RASSEN_ZONDER_STAMBOOM = ['huiskat', 'kruising', 'europese korthaar', 'eur', 'ekh'];

export function vraagtStamboom(ras: string) {
  const r = ras.trim().toLowerCase();
  return r !== '' && !RASSEN_ZONDER_STAMBOOM.includes(r);
}

/** Fokverbod in Nederland: naaktkatten en katten met vouworen. */
export const VERBODEN_RAS = /(sphynx|naakt|fold|levkoy|bambino|donskoy|peterbald|\bdwelf\b|\belf\b)/i;

export const ORGANISATIES = ['FIFe (o.a. Felikat)', 'WCF', 'TICA', 'Anders'];

/** Gebruikelijke testen per ras, als suggestie. De verkoper kiest zelf wat er gedaan is. */
export const TESTEN_ALGEMEEN = ['FIV/FeLV', 'Hartecho (HCM)'];
export const TESTEN_PER_RAS: Record<string, string[]> = {
  'brits korthaar': ['PKD', 'pd-PRA', 'Bloedgroep'],
  'brits langhaar': ['PKD', 'pd-PRA', 'Bloedgroep'],
  'maine coon': ['HCM DNA', 'SMA', 'PK-deficiëntie', 'Bloedgroep'],
  'noorse boskat': ['PK-deficiëntie', 'GSD IV', 'Bloedgroep'],
  ragdoll: ['HCM DNA', 'PKD', 'pd-PRA', 'Bloedgroep'],
  bengaal: ['rdAc-PRA', 'b-PRA', 'PK-deficiëntie', 'Bloedgroep'],
  perzisch: ['PKD', 'pd-PRA', 'Bloedgroep'],
  exotic: ['PKD', 'pd-PRA', 'Bloedgroep'],
  'siberische kat': ['PK-deficiëntie', 'PKD', 'Bloedgroep'],
  abessijn: ['PK-deficiëntie', 'rdAc-PRA', 'PKD'],
  somali: ['PK-deficiëntie', 'rdAc-PRA', 'PKD'],
};
export function testSuggesties(ras: string) {
  return [...TESTEN_ALGEMEEN, ...(TESTEN_PER_RAS[ras.trim().toLowerCase()] ?? [])];
}

export const UITSLAGEN = ['Negatief', 'Vrij', 'Normaal', 'Drager', 'Anders'] as const;
export const GOEDE_UITSLAG = ['Negatief', 'Vrij', 'Normaal'];

/** Uitleg in gewone taal, voor kopers. */
export const TEST_UITLEG: Record<string, string> = {
  'FIV/FeLV': 'besmettelijke virussen (kattenaids en leukose)',
  'Hartecho (HCM)': 'hartaandoening, onderzocht met een echo door een cardioloog',
  'HCM DNA': 'erfelijke hartaandoening, DNA-test',
  PKD: 'erfelijke nieraandoening met cysten',
  'pd-PRA': 'erfelijke oogaandoening die tot blindheid kan leiden',
  'rdAc-PRA': 'erfelijke oogaandoening die tot blindheid kan leiden',
  'b-PRA': 'erfelijke oogaandoening bij Bengalen',
  SMA: 'erfelijke spieraandoening',
  'PK-deficiëntie': 'erfelijke vorm van bloedarmoede',
  'GSD IV': 'erfelijke stofwisselingsziekte',
  Bloedgroep: 'belangrijk om problemen bij pasgeboren kittens te voorkomen',
};

/**
 * Eenvoudige controle op een stamboomnummer. Echt nakijken kan alleen met de papieren,
 * maar zo werken “123”, “xxx” of “11111” niet.
 */
export function stamboomnrProbleem(nr: string): string | null {
  const t = nr.trim();
  const cijfers = t.replace(/\D/g, '');
  if (t.length < 5 || cijfers.length < 4) return 'is te kort. Neem het nummer over zoals het op de stamboom staat.';
  if (/^(\d)\1+$/.test(cijfers)) return 'lijkt niet echt. Neem het nummer over zoals het op de stamboom staat.';
  const oplopend = '0123456789012345678901234567890';
  const aflopend = '9876543210987654321098765432109';
  if (cijfers.length >= 4 && (oplopend.includes(cijfers) || aflopend.includes(cijfers)))
    return 'lijkt niet echt. Neem het nummer over zoals het op de stamboom staat.';
  return null;
}

/** Eén test van een ouder */
export type OuderTest = { test: string; uitslag: string; datum: string };

/** Haalt de nette melding uit een fout van de database ("NESTJE: …"). */
export function nestjeMelding(fout: { message?: string } | null | undefined, standaard: string) {
  const m = fout?.message ?? '';
  const i = m.indexOf('NESTJE:');
  return i >= 0 ? m.slice(i + 7).trim() : standaard;
}

/** "Ras: Maine Coon" of "Moeder Maine Coon, vader Ragdoll". Leeg als niets is ingevuld. */
export function rasTekst(moeder?: string | null, vader?: string | null) {
  const m = moeder?.trim();
  const v = vader?.trim();
  if (m && v && m.toLowerCase() !== v.toLowerCase()) return `Moeder ${m}, vader ${v}`;
  if (m || v) return `Ras: ${m || v}`;
  return '';
}

export type GezondheidVeld = 'gechipt' | 'enting1' | 'enting2' | 'ontwormd' | 'ontvlooid' | 'dierenarts';

export const GEZONDHEID: [GezondheidVeld, string][] = [
  ['gechipt', 'Gechipt'],
  ['enting1', '1e enting'],
  ['enting2', '2e enting'],
  ['ontwormd', 'Ontwormd'],
  ['ontvlooid', 'Ontvlooid'],
  ['dierenarts', 'Gezondheidscheck dierenarts'],
];

/** 5.2 → "5,2 kg" */
export const kiloNL = (kg: number) =>
  `${new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 }).format(Number(kg))} kg`;

/** "Milou (Maine Coon, 5,2 kg)" */
export function ouderLabel(naam: string | null | undefined, ras?: string | null, gewicht?: number | null) {
  const extra = [ras?.trim(), gewicht ? kiloNL(gewicht) : ''].filter(Boolean).join(', ');
  const n = naam?.trim() || '';
  if (n && extra) return `${n} (${extra})`;
  return n || extra;
}
