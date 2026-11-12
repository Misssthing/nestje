import { fotoUrl } from '@/lib/config';
import { aantalKittens, aftelling, dagen, prijsNL, rasDelen, VERKOPER_LABEL } from '@/lib/nest';
import type { OverzichtNest } from '@/lib/types';
import type { NestKaartData } from '@/components/NestKaart';

/** Rassen van een nestje, zonder dubbele: "Brits korthaar × Brits langhaar" */
export function rasVan(n: Pick<OverzichtNest, 'moeder_ras' | 'vader_ras'>) {
  const delen = [...new Map([...rasDelen(n.moeder_ras), ...rasDelen(n.vader_ras)].map((r) => [r.toLowerCase(), r])).values()];
  return delen.length ? delen.join(' × ') : null;
}

/** "♂ 1 ♀ 3": bij vrije kittens alleen de vrije, anders alle kittens. Leeg als geen geslacht bekend is. */
export function geslachtTekst(n: Pick<OverzichtNest, 'vrij' | 'vrij_katers' | 'vrij_poezen' | 'katers' | 'poezen'>) {
  const k = n.vrij > 0 ? n.vrij_katers ?? 0 : n.katers ?? 0;
  const p = n.vrij > 0 ? n.vrij_poezen ?? 0 : n.poezen ?? 0;
  return k + p > 0 ? `♂ ${k} ♀ ${p}` : '';
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
    const g = geslachtTekst(n);
    label = `${n.vrij} vrij${g ? ` (${g})` : ''} · ${a.wekenTeGaan > 0 ? `nog ${a.wekenTeGaan} wk` : 'mag verhuizen'}`;
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
      [
        a.verwacht ? 'Verwacht nestje' : aantalKittens(n.kittens),
        !a.verwacht && n.vrij === 0 ? geslachtTekst(n) : '',
        ras,
        n.stamboom ? 'met stamboom' : '',
      ].filter(Boolean).join(' · '),
      [n.woonplaats, n.provincie].filter(Boolean).join(', '),
    ],
    prijs: n.prijs ? prijsNL(Number(n.prijs)) : null,
    verkoper: n.verkoper ? `${VERKOPER_LABEL[n.verkoper]}${n.verkoper === 'fokker' && n.cattery_gecontroleerd ? ' · gecontroleerd' : ''}` : null,
    vondeling: n.soort === 'vondeling',
    fotos,
  };
}
