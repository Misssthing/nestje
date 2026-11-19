import Link from 'next/link';
import { KENNISCENTRUM_ARTIKELEN } from '@/lib/kenniscentrum';

type Props = {
  /** De href van het huidige artikel, zodat het zichzelf niet aanbeveelt */
  huidige: string;
};

/**
 * "Lees ook"-blok onderaan een kenniscentrum-artikel, met de andere artikelen uit de lijst
 * (uitbreiding 38). Pakt de lijst uit src/lib/kenniscentrum.ts, dus een nieuw artikel verschijnt
 * hier vanzelf. Toont er maximaal 3; bij meer artikelen verschijnt een link naar het hele
 * kenniscentrum.
 */
export default function LeesOok({ huidige }: Props) {
  const andere = KENNISCENTRUM_ARTIKELEN.filter((a) => a.href !== huidige);
  if (!andere.length) return null;

  return (
    <section className="lees-ook" aria-labelledby="lees-ook-kop">
      <div className="blokkop">
        <h2 id="lees-ook-kop">Lees ook</h2>
        {andere.length > 3 && (
          <Link href="/kenniscentrum" className="blokkop-link">Alle artikelen →</Link>
        )}
      </div>
      <div className="artikel-grid">
        {andere.slice(0, 3).map((a) => (
          <Link key={a.href} href={a.href} className="artikel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.afbeelding} alt="" loading="lazy" />
            <span className="artikel-tekst">
              <strong>{a.titel}</strong>
              <span className="artikel-intro">{a.intro}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
