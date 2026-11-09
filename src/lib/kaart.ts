import { fotoUrl } from '@/lib/config';
import { aantalKittens, aftelling, dagen, prijsNL, rasDelen, VERKOPER_LABEL } from '@/lib/nest';
import type { OverzichtNest } from '@/lib/types';
import type { NestKaartData } from '@/components/NestKaart';

/** Rassen van een nestje, zonder dubbele: "Brits korthaar × Brits langhaar" */
export function rasVan(n: Pick<OverzichtNest, 'moeder_ras' | 'vader_ras'>) {
  const delen = [...new Map([...rasDelen(n.moeder_ras), ...rasDelen(n.vader_ras)].map((r) => [r.toLowerCase(), r])).values()];
  return delen.length ? delen.join(' × ') : null;
}

/** Van een rij uit het openbare overzicht naar de gegevens voor een fotokaart. */
export function naarKaart(n: OverzichtNest): NestKaartData {
  const a = aftelling(n.geboortedatum, n.verhuisleeftijd_weken);
  const ras = rasVan(n);
  const fotos = (n.fotos?.length ? n.fotos : n.foto ? [n.foto] : []).map(fotoUrl);

  let label: string;
  let labelSoort: NestKaartData['labelSoort'] = 'vrij';
  if (a.verwacht) {
    label = `Verwacht over ${dagen(a.dagenTotGeboorte)}`;
    labelSoort = 'optie';
  } else if (n.vrij > 0) {
    label = `${n.vrij} vrij · ${a.wekenTeGaan > 0 ? `nog ${a.wekenTeGaan} wk` : 'mag verhuizen'}`;
  } else {
    label = `${n.optie} onder optie`;
    labelSoort = 'optie';
  }

  return {
    slug: n.slug,
    titel: `Het nestje van ${n.moeder_naam}`,
    label,
    labelSoort,
    regels: [
      [a.verwacht ? 'Verwacht nestje' : aantalKittens(n.kittens), ras, n.stamboom ? 'met stamboom' : ''].filter(Boolean).join(' · '),
      [n.woonplaats, n.provincie].filter(Boolean).join(', '),
    ],
    prijs: n.prijs ? prijsNL(Number(n.prijs)) : null,
    verkoper: n.verkoper ? VERKOPER_LABEL[n.verkoper] : null,
    vondeling: n.soort === 'vondeling',
    fotos,
  };
}
