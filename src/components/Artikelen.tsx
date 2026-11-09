import { metUtm } from '@/lib/config';
import { ALLE_ARTIKELEN_URL, kiesArtikelen } from '@/lib/artikelen';

type Props = {
  titel?: string;
  /** Trefwoorden die voorrang krijgen, zoals het ras van het nestje */
  trefwoorden?: string[];
  /** Voor de UTM-tags: waar staat dit blok? */
  plek: string;
  slug?: string;
};

/** Drie artikelen uit de categorie Kittens op kattenverzorging.com, met afbeelding. */
export default async function Artikelen({ titel = 'Handig om te lezen', trefwoorden = [], plek, slug }: Props) {
  const artikelen = await kiesArtikelen(3, trefwoorden);
  const utm = (url: string) => (slug ? metUtm(url, plek, slug) : metUtm(url, plek));
  if (!artikelen.length) return null;

  return (
    <section className="artikelen" aria-labelledby={`artikelen-${plek}`}>
      <div className="blokkop">
        <h2 id={`artikelen-${plek}`}>{titel}</h2>
        <a href={utm(ALLE_ARTIKELEN_URL)} className="blokkop-link">Alle artikelen →</a>
      </div>
      <div className="artikel-grid">
        {artikelen.map((a) => (
          <a key={a.id} href={utm(a.url)} className="artikel">
            {a.afbeelding ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.afbeelding} alt="" loading="lazy" />
            ) : (
              <span className="artikel-geenfoto" aria-hidden="true" />
            )}
            <span className="artikel-tekst">
              <strong>{a.titel}</strong>
              {a.intro && <span className="artikel-intro">{a.intro}</span>}
              <span className="artikel-meta">{a.leestijd} min leestijd</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
