/**
 * "Bedoel je gmail.com?"-suggestie bij een tikfout in een bekend e-maildomein.
 * Vangt geen ongeldige adressen af (dat doet de gewone e-mailcontrole al), maar wel
 * domeinen die heel dicht bij een bekende aanbieder liggen, zoals "gmail.vom" of "hotmial.com".
 * Een eigen of onbekend domein (bijv. "mijnbedrijf.nl") wordt nooit "gecorrigeerd".
 */

const BEKENDE_DOMEINEN = [
  'gmail.com', 'hotmail.com', 'hotmail.nl', 'outlook.com', 'outlook.nl', 'live.nl', 'live.com',
  'icloud.com', 'yahoo.com', 'yahoo.nl', 'ziggo.nl', 'kpnmail.nl', 'home.nl', 'telfort.nl',
  'xs4all.nl', 'planet.nl', 'online.nl', 'caiway.nl', 'quicknet.nl', 'chello.nl', 'upcmail.nl',
  'hetnet.nl', 'wanadoo.nl', 'zonnet.nl', 'proton.me', 'protonmail.com', 'gmx.com', 'gmx.net',
];

/** Kleinste aantal invoegingen/verwijderingen/vervangingen om a in b te veranderen. */
function afstand(a: string, b: string): number {
  const rijen = a.length + 1;
  const kolommen = b.length + 1;
  const d: number[][] = Array.from({ length: rijen }, () => new Array<number>(kolommen).fill(0));
  for (let i = 0; i < rijen; i++) d[i][0] = i;
  for (let j = 0; j < kolommen; j++) d[0][j] = j;
  for (let i = 1; i < rijen; i++) {
    for (let j = 1; j < kolommen; j++) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + kosten);
    }
  }
  return d[rijen - 1][kolommen - 1];
}

/** Geeft een voorgesteld e-mailadres terug, of null als er niets te corrigeren valt. */
export function voorstelEmail(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 1 || at === email.length - 1) return null;
  const lokaal = email.slice(0, at);
  const domein = email.slice(at + 1).trim().toLowerCase();
  if (!domein.includes('.') || BEKENDE_DOMEINEN.includes(domein)) return null;

  let beste: string | null = null;
  let kleinsteAfstand = Infinity;
  for (const d of BEKENDE_DOMEINEN) {
    const afst = afstand(domein, d);
    if (afst < kleinsteAfstand) {
      kleinsteAfstand = afst;
      beste = d;
    }
  }
  // Max. 2 tikfouten, en alleen als dat relatief weinig is t.o.v. de lengte van het domein.
  if (!beste || kleinsteAfstand === 0 || kleinsteAfstand > 2 || kleinsteAfstand / beste.length > 0.3) return null;
  return `${lokaal}@${beste}`;
}
