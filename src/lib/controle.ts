import type { KittenMetFotos, Nest, NestFoto, Profiel } from '@/lib/types';
import { ALLE_VELDEN } from '@/lib/vertrouwen';

/**
 * Wie mag nestjes controleren voor het overzicht. Standaard nestje@kattenverzorging.com.
 * In Vercel aan te passen met ADMIN_EMAIL, ook met meerdere adressen: "nestje@kattenverzorging.com, jij@gmail.com".
 * Meldingen gaan naar het eerste adres.
 */
export const ADMIN_EMAILS = (process.env.ADMIN_EMAIL ?? 'nestje@kattenverzorging.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
export const ADMIN_EMAIL = ADMIN_EMAILS[0];
export const isAdmin = (email?: string | null) => Boolean(email) && ADMIN_EMAILS.includes(email!.toLowerCase());

/** Waar de checklist naartoe springt in het beheer */
export type Plek = 'nestfotos' | 'ouders' | 'kittens' | 'gegevens' | 'gezondheid' | 'overzicht' | 'profiel';

export type Stap = {
  id: string;
  tekst: string;
  uitleg: string;
  klaar: boolean;
  plek: Plek;
  /** Nodig om in het openbare overzicht te komen (anders alleen aanbevolen) */
  voorOverzicht: boolean;
};

const standaardNaam = (naam: string) => /^kitten \d+$/i.test(naam.trim());

/** De stappen voor een compleet nestje, met wat al klaar is. */
export function stappen(nest: Nest, kittens: KittenMetFotos[], nestFotos: NestFoto[], profiel?: Profiel | null): Stap[] {
  const vondeling = nest.soort === 'vondeling';
  const lijst: Stap[] = [];

  if (!vondeling) {
    lijst.push({
      id: 'moederfoto',
      tekst: 'Foto van de moeder',
      uitleg: 'Het liefst samen met haar kittens. Zonder deze foto komt je nestje niet in het overzicht.',
      klaar: Boolean(nest.moeder_foto),
      plek: 'ouders',
      voorOverzicht: true,
    });
  }
  lijst.push({
    id: 'whatsapp',
    tekst: 'Je WhatsApp-nummer',
    uitleg: 'Zo kunnen kopers je bereiken. Je nummer staat nooit als tekst op je pagina.',
    klaar: Boolean(nest.whatsapp_nummer),
    plek: 'gegevens',
    voorOverzicht: false,
  });
  lijst.push({
    id: 'kittenfotos',
    tekst: "Foto's van elk kitten",
    uitleg: kittens.length ? 'Minstens één foto per kitten.' : 'Voeg eerst je kittens toe.',
    klaar: kittens.length > 0 && kittens.every((k) => k.kitten_photos.length > 0),
    plek: 'kittens',
    voorOverzicht: false,
  });
  lijst.push({
    id: 'namen',
    tekst: 'Namen en kleur van de kittens',
    uitleg: 'Een naam in plaats van “Kitten 1”, plus geslacht en vacht.',
    klaar: kittens.length > 0 && kittens.every((k) => !standaardNaam(k.naam) && Boolean(k.vacht?.trim())),
    plek: 'kittens',
    voorOverzicht: false,
  });
  lijst.push({
    id: 'nestfoto',
    tekst: 'Een foto van het hele nestje',
    uitleg: 'Komt bovenaan je pagina en in de afbeelding die WhatsApp en Facebook laten zien.',
    klaar: nestFotos.length > 0,
    plek: 'nestfotos',
    voorOverzicht: false,
  });
  if (nest.stamboom === true) {
    lijst.push({
      id: 'stamboom',
      tekst: 'Stamboomgegevens',
      uitleg: 'Organisatie, catterynaam en de naam van de vader. Zonder deze drie toont je pagina geen “met stamboom”. Stamboomnummers zijn optioneel.',
      klaar: Boolean(nest.stamboom_organisatie && nest.cattery?.trim() && nest.vader_naam?.trim()),
      plek: 'gegevens',
      voorOverzicht: false,
    });
  }
  lijst.push({
    id: 'gezondheid',
    tekst: 'Gezondheid en vertrouwen',
    uitleg: 'Vink aan wat geregeld is, zoals chip en entingen, en of kopers eerst mogen komen kijken.',
    klaar: ALLE_VELDEN.some((v) => Boolean(nest[v])),
    plek: 'gezondheid',
    voorOverzicht: false,
  });
  if (nest.soort !== 'vondeling') {
    const fokker = nest.stamboom === true;
    lijst.push({
      id: 'profiel',
      tekst: fokker ? 'Vertel wie je bent als fokker' : 'Vertel wie je bent',
      uitleg: fokker
        ? 'Je cattery, sinds wanneer je fokt, welke rassen en bij welke vereniging. Komt op je profielpagina en bij je nestjes.'
        : 'Een paar zinnen over jou en je katten. Kopers vertrouwen een verkoper die ze een beetje kennen.',
      klaar: Boolean(profiel?.zichtbaar && profiel.intro?.trim()),
      plek: 'profiel',
      voorOverzicht: false,
    });
  }
  lijst.push({
    id: 'overzicht',
    tekst: 'In het overzicht van Nestje',
    uitleg: 'Zet bij “Gevonden worden op Nestje” het overzicht aan en kies je provincie.',
    klaar: Boolean(nest.in_overzicht && nest.provincie),
    plek: 'overzicht',
    voorOverzicht: true,
  });
  return lijst;
}
