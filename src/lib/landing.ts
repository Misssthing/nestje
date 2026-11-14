import { PROVINCIES, RASSEN, RASSEN_ALGEMEEN } from '@/lib/nest';

/** "Maine Coon" → "maine-coon", "België" → "belgie" */
export function landingSlug(naam: string) {
  return naam
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export type Landing = { soort: 'ras' | 'provincie'; naam: string; slug: string; kop: string; intro: string; titel: string; beschrijving: string };

function rasLanding(naam: string): Landing {
  const algemeen = RASSEN_ALGEMEEN.some((r) => r.toLowerCase() === naam.toLowerCase());
  const kort = algemeen ? naam.toLowerCase() : naam;
  return {
    soort: 'ras',
    naam,
    slug: landingSlug(naam),
    kop: algemeen ? `${naam} kittens te koop` : `${naam} kittens te koop`,
    titel: `${naam} kittens te koop`,
    intro: algemeen
      ? `Op zoek naar een ${kort} kitten? Hier vind je nestjes van hobbyverkopers in Nederland en België. Je ziet meteen welke kittens nog vrij zijn en wanneer ze mogen verhuizen.`
      : `Op zoek naar een ${naam} kitten? Op Nestje zie je alleen ${naam}-kittens met een stamboom, van fokkers in Nederland en België. Je ziet meteen welke kittens nog vrij zijn en wanneer ze mogen verhuizen.`,
    beschrijving: algemeen
      ? `${naam} kittens te koop in Nederland en België. Bekijk nestjes, zie welke kittens nog vrij zijn en wanneer ze mogen verhuizen.`
      : `${naam} kittens met stamboom te koop in Nederland en België. Bekijk nestjes van fokkers, zie welke kittens nog vrij zijn en wanneer ze mogen verhuizen.`,
  };
}

function provincieLanding(naam: string): Landing {
  const in_ = naam === 'België' ? 'in België' : `in ${naam}`;
  return {
    soort: 'provincie',
    naam,
    slug: landingSlug(naam),
    kop: `Kittens te koop ${in_}`,
    titel: `Kittens te koop ${in_}`,
    intro: `Zoek je een kitten ${in_}? Hier vind je nestjes van hobbyverkopers en fokkers bij jou in de buurt. Je ziet meteen welke kittens nog vrij zijn en wanneer ze mogen verhuizen. Kom altijd eerst kijken, bij de kittens én hun moeder.`,
    beschrijving: `Kittens te koop ${in_}: nestjes van hobbyverkopers en fokkers bij jou in de buurt. Zie welke kittens nog vrij zijn en wanneer ze mogen verhuizen.`,
  };
}

/** Alle vaste pagina's: één per ras en één per provincie. */
export const LANDINGS: Landing[] = [...RASSEN.map(rasLanding), ...PROVINCIES.map(provincieLanding)];

/** Populaire rassen die we altijd als link tonen (overzichtpagina en footer), voor Google en voor bezoekers. */
export const POPULAIRE_RASSEN = [
  'Huiskat', 'Europese korthaar', 'Brits korthaar', 'Brits langhaar', 'Maine Coon', 'Ragdoll',
  'Noorse boskat', 'Siberische kat', 'Bengaal', 'Perzisch', 'Savannah',
];

export function vindLanding(slug: string) {
  return LANDINGS.find((l) => l.slug === slug) ?? null;
}

/** De vaste pagina bij een rasnaam of provincie, als die bestaat. */
export function landingVoor(soort: Landing['soort'], naam: string) {
  return LANDINGS.find((l) => l.soort === soort && l.naam.toLowerCase() === naam.toLowerCase()) ?? null;
}
