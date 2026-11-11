import { RASSEN_ALGEMEEN } from '@/lib/nest';

/** Het artikel op kattenverzorging.com over raskitten kopen. Verandert de link, pas hem dan alleen hier aan. */
export const RAS_ARTIKEL_URL = 'https://www.kattenverzorging.com/raskitten-kopen-waarom-een-stamboom/';

type Uitleg = { anker: string; waarom: string };

/** Per ras: het anker in het testschema van het artikel en waar de ouders op getest worden. Kleine letters. */
const PER_RAS: Record<string, Uitleg> = {
  'maine coon': { anker: 'maine-coon', waarom: 'HCM, een hartziekte die vaak voorkomt bij dit ras' },
  'brits korthaar': { anker: 'brits-korthaar', waarom: 'PKD, een erfelijke nierziekte' },
  'brits langhaar': { anker: 'brits-korthaar', waarom: 'PKD, een erfelijke nierziekte' },
  perzisch: { anker: 'pers-exotic', waarom: 'PKD, een erfelijke nierziekte die bij dit ras vaak voorkomt' },
  exotic: { anker: 'pers-exotic', waarom: 'PKD, een erfelijke nierziekte die bij dit ras vaak voorkomt' },
  ragdoll: { anker: 'ragdoll', waarom: 'HCM, een hartziekte die bij dit ras hoort' },
  'noorse boskat': { anker: 'noorse-boskat', waarom: 'GSD IV en PK-def, een stofwisselingsziekte en een bloedziekte' },
  bengaal: { anker: 'bengaal', waarom: 'PRA-b, een oogziekte die blindheid geeft' },
  'siberische kat': { anker: 'siberische-kat', waarom: 'HCM, een hartziekte' },
};

/** Uitleg bij een gekozen ras, of null voor Huiskat, Kruising en Europese korthaar. */
export function rasUitleg(ras: string) {
  const l = ras.trim().toLowerCase();
  if (!l || RASSEN_ALGEMEEN.some((r) => r.toLowerCase() === l)) return null;
  const u = PER_RAS[l];
  return {
    tekst: u
      ? `Zonder stamboom kun je niet nagaan of een kitten echt een ${ras} is. En ook niet of de ouders getest zijn op ${u.waarom}. Daarom zie je hier alleen ${ras}-kittens met stamboom.`
      : `Zonder stamboom kun je niet nagaan of een kitten echt een ${ras} is, en ook niet of de ouders getest zijn op erfelijke ziektes. Daarom zie je hier alleen ${ras}-kittens met stamboom.`,
    anker: u?.anker ?? '',
  };
}
