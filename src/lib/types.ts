export type Status = 'vrij' | 'gereserveerd' | 'verhuisd';
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
}

export type KittenMetFotos = Kitten & { kitten_photos: Foto[] };
