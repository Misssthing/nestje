export type KennisArtikel = {
  titel: string;
  intro: string;
  href: string;
  afbeelding: string;
};

/**
 * Eén centrale lijst met kenniscentrum-artikelen (uitbreiding 38). Wordt gebruikt op /kenniscentrum
 * zelf én in het "Lees ook"-blok onderaan elk artikel. Een nieuw artikel toevoegen: één regel hier,
 * en zet op de nieuwe pagina zelf <LeesOok huidige="/nieuw-artikel" />.
 */
export const KENNISCENTRUM_ARTIKELEN: KennisArtikel[] = [
  {
    titel: 'Een kitten reserveren voor hij geboren is',
    intro: 'Waar je op moet letten, welke vragen je stelt, en hoe je een serieuze fokker herkent.',
    href: '/kitten-reserveren',
    afbeelding: '/kenniscentrum/kitten-reserveren.jpg',
  },
  {
    titel: 'Gezondheidstesten bij kittens, uitgelegd',
    intro: 'DNA-test of hartecho? Wat betekent "Drager"? En is een getest ouderdier een garantie voor de kitten zelf?',
    href: '/gezondheidstesten-kittens',
    afbeelding: '/kenniscentrum/gezondheidstesten.jpg',
  },
  {
    titel: 'De eerste dagen met je kitten',
    intro: 'Zo laat je een kitten rustig wennen in huis: de wenkamer, andere huisdieren, eten en de dierenarts.',
    href: '/eerste-dagen',
    afbeelding: '/kenniscentrum/eerste-dagen.jpg',
  },
];
