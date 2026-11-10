import type { KittenMetFotos, Nest, NestFoto } from '@/lib/types';

/** Wie mag nestjes controleren voor het overzicht. In Vercel aan te passen met ADMIN_EMAIL. */
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'nestje@kattenverzorging.com').toLowerCase();
export const isAdmin = (email?: string | null) => Boolean(email) && email!.toLowerCase() === ADMIN_EMAIL;

/** Waar de checklist naartoe springt in het beheer */
export type Plek = 'nestfotos' | 'ouders' | 'kittens' | 'gegevens';

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
export function stappen(nest: Nest, kittens: KittenMetFotos[], nestFotos: NestFoto[]): Stap[] {
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
      tekst: 'Stamboomgegevens van beide ouders',
      uitleg: 'Organisatie, cattery, stamboomnummers en de naam van de vader.',
      klaar: Boolean(
        nest.stamboom_organisatie && nest.cattery?.trim() && nest.moeder_stamboomnr && nest.vader_stamboomnr && nest.vader_naam?.trim(),
      ),
      plek: 'gegevens',
      voorOverzicht: false,
    });
  }
  lijst.push({
    id: 'overzicht',
    tekst: 'In het overzicht van Nestje',
    uitleg: 'Zet bij Gegevens “Tonen in het overzicht” aan en kies je provincie. Kopers vinden je dan op /kittens.',
    klaar: Boolean(nest.in_overzicht && nest.provincie),
    plek: 'gegevens',
    voorOverzicht: true,
  });
  return lijst;
}
