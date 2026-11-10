import type { Nest } from '@/lib/types';

export type VertrouwenVeld =
  | 'dierenarts' | 'enting1' | 'enting2' | 'ontwormd' | 'ontvlooid' | 'gechipt' | 'paspoort'
  | 'stamboom_papieren' | 'koopovereenkomst' | 'gesocialiseerd' | 'ouders_te_zien' | 'bezoek_mogelijk';

/** Gezondheid: hangt af van "al gedaan" of "bij verhuizing" */
export const GEZONDHEID_NEST: [VertrouwenVeld, string][] = [
  ['dierenarts', 'Gezondheidscheck bij de dierenarts'],
  ['enting1', '1e enting'],
  ['enting2', '2e enting'],
  ['ontwormd', 'Ontwormd'],
  ['ontvlooid', 'Ontvlooid'],
  ['gechipt', 'Gechipt'],
  ['paspoort', 'Europees dierenpaspoort'],
];

/** Vertrouwen en kennismaken */
export const VERTROUWEN_NEST: [VertrouwenVeld, string][] = [
  ['ouders_te_zien', 'De moeder is te zien'],
  ['bezoek_mogelijk', 'Je kunt eerst komen kijken'],
  ['gesocialiseerd', 'Opgegroeid in huis, gewend aan mensen'],
  ['koopovereenkomst', 'Met koopovereenkomst'],
  ['stamboom_papieren', 'Stamboompapieren gaan mee'],
];

export const ALLE_VELDEN = [...GEZONDHEID_NEST, ...VERTROUWEN_NEST].map(([v]) => v);

/** Mag een kitten op Verhuisd? Huisregel: gechipt en minstens de 1e enting. */
export const magVerhuizen = (n: Pick<Nest, 'gechipt' | 'enting1'>) => Boolean(n.gechipt && n.enting1);
