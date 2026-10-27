export type Status = 'vrij' | 'optie' | 'gereserveerd' | 'verhuisd';
export type Geslacht = 'kater' | 'poes';

export interface Nest {
  id: string;
  slug: string;
  moeder_naam: string;
  woonplaats: string | null;
  geboortedatum: string; // yyyy-mm-dd
  verhuisleeftijd_weken: number;
  prijs: number | null;
  whatsapp_nummer: string | null;
  over_moeder: string | null;
  vader_naam: string | null;
  over_vader: string | null;
  moeder_ras: string | null;
  vader_ras: string | null;
  stamboom: boolean | null;
  ouders_getest: boolean | null;
  ouders_test_info: string | null;
  moeder_gewicht: number | null;
  vader_gewicht: number | null;
  moeder_foto: string | null;
  vader_foto: string | null;
  afgerond: boolean;
  gezondheid_bij_verhuizing: boolean;
  in_overzicht: boolean;
  provincie: string | null;
  geboortedatum_geschat: boolean;
  soort: 'eigen' | 'vondeling';
  stamboom_organisatie: string | null;
  cattery: string | null;
  moeder_stamboomnr: string | null;
  vader_stamboomnr: string | null;
  moeder_chip?: string | null;
  moeder_testen: { test: string; uitslag: string; datum: string }[];
  vader_testen: { test: string; uitslag: string; datum: string }[];
}

export type OpenbaarNest = Omit<Nest, 'whatsapp_nummer'> & { heeft_whatsapp: boolean };

/** Gemeenschappelijke vorm van kitten- en nestfoto's */
export interface FotoRij {
  id: string;
  storage_path: string;
  volgorde: number;
}

export interface Foto extends FotoRij {
  kitten_id: string;
}

export interface NestFoto extends FotoRij {
  nest_id: string;
}

export interface Kitten {
  id: string;
  nest_id: string;
  naam: string;
  geslacht: Geslacht;
  vacht: string | null;
  status: Status;
  volgorde: number;
  omschrijving: string | null;
  /** Alleen voor de verkoper, nooit in de openbare views */
  notitie: string | null;
  gechipt: boolean;
  enting1: boolean;
  enting2: boolean;
  ontwormd: boolean;
  ontvlooid: boolean;
  dierenarts: boolean;
}

export type KittenMetFotos = Kitten & { kitten_photos: Foto[] };

/** Optionele profielpagina van een verkoper of opvang */
export interface Profiel {
  owner_id: string;
  slug: string;
  naam: string;
  intro: string | null;
  zichtbaar: boolean;
}

/** Nestje zoals het op een openbare profielpagina verschijnt */
export interface ProfielNest {
  profiel_slug: string;
  profiel_naam: string;
  slug: string;
  moeder_naam: string;
  woonplaats: string | null;
  geboortedatum: string;
  verhuisleeftijd_weken: number;
  afgerond: boolean;
  kittens: number;
  vrij: number;
  foto: string | null;
}

/** Nestje zoals het in het openbare overzicht staat */
export interface OverzichtNest {
  slug: string;
  moeder_naam: string;
  woonplaats: string | null;
  provincie: string | null;
  moeder_ras: string | null;
  vader_ras: string | null;
  stamboom: boolean | null;
  geboortedatum: string;
  verhuisleeftijd_weken: number;
  prijs: number | null;
  kittens: number;
  vrij: number;
  optie: number;
  foto: string | null;
  soort?: 'eigen' | 'vondeling';
}
