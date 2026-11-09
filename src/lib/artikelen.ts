/**
 * Artikelen uit de categorie "Kittens" op kattenverzorging.com, via de openbare WordPress-koppeling.
 * Nieuwe artikelen in die categorie verschijnen vanzelf (binnen 6 uur) op Nestje.
 */
const SITE = 'https://www.kattenverzorging.com';
const CATEGORIE_ID = 5; // https://www.kattenverzorging.com/category/kittens/
export const ALLE_ARTIKELEN_URL = `${SITE}/category/kittens/`;

export type Artikel = {
  id: number;
  url: string;
  titel: string;
  intro: string;
  afbeelding: string | null;
  leestijd: number;
  datum: string;
};

type WpPost = {
  id: number;
  link: string;
  date: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  content?: { rendered?: string };
  yoast_head_json?: { og_image?: { url?: string }[] };
  _embedded?: {
    'wp:featuredmedia'?: {
      source_url?: string;
      media_details?: { sizes?: Record<string, { source_url?: string }> };
    }[];
  };
};

const ENTITEITEN: Record<string, string> = {
  '&amp;': '&', '&quot;': '"', '&#039;': "'", '&#39;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ',
  '&hellip;': '…', '&#8230;': '…', '&#8217;': '’', '&#8216;': '‘', '&#8220;': '“', '&#8221;': '”',
  '&#8211;': '–', '&#8212;': '—', '&euro;': '€',
};

/** HTML uit WordPress omzetten naar gewone tekst. */
function tekst(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[#a-z0-9]+;/gi, (e) => ENTITEITEN[e.toLowerCase()] ?? (/^&#\d+;$/.test(e) ? String.fromCharCode(Number(e.slice(2, -1))) : ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function kort(t: string, max = 140) {
  const zonderMeer = t.replace(/\s*(\[…\]|…|Lees meer.*)$/i, '').trim();
  if (zonderMeer.length <= max) return zonderMeer;
  return `${zonderMeer.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

function naarArtikel(p: WpPost): Artikel {
  const media = p._embedded?.['wp:featuredmedia']?.[0];
  const maten = media?.media_details?.sizes ?? {};
  const afbeelding =
    maten.medium_large?.source_url ?? maten.large?.source_url ?? media?.source_url ?? p.yoast_head_json?.og_image?.[0]?.url ?? null;
  const woorden = tekst(p.content?.rendered).split(' ').length;
  return {
    id: p.id,
    url: p.link,
    titel: tekst(p.title?.rendered),
    intro: kort(tekst(p.excerpt?.rendered)),
    afbeelding,
    leestijd: Math.max(2, Math.round(woorden / 220)),
    datum: p.date,
  };
}

/** De nieuwste artikelen uit de categorie. Bij een storing een lege lijst: de pagina werkt dan gewoon door. */
export async function haalArtikelen(): Promise<Artikel[]> {
  try {
    const res = await fetch(
      `${SITE}/wp-json/wp/v2/posts?categories=${CATEGORIE_ID}&per_page=20&_embed=wp:featuredmedia`,
      { next: { revalidate: 6 * 3600 }, signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as WpPost[];
    return Array.isArray(data) ? data.map(naarArtikel).filter((a) => a.titel && a.url) : [];
  } catch {
    return [];
  }
}

/**
 * Kies er een paar: eerst artikelen waarvan de titel een van de trefwoorden bevat (bijvoorbeeld het ras),
 * daarna de nieuwste.
 */
export async function kiesArtikelen(aantal = 3, trefwoorden: string[] = []): Promise<Artikel[]> {
  const alle = await haalArtikelen();
  const woorden = trefwoorden.map((w) => w.toLowerCase()).filter((w) => w.length > 2);
  const passend = woorden.length ? alle.filter((a) => woorden.some((w) => a.titel.toLowerCase().includes(w))) : [];
  const rest = alle.filter((a) => !passend.includes(a));
  return [...passend, ...rest].slice(0, aantal);
}
