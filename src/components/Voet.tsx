import Link from 'next/link';
import { CONFIG, metUtm } from '@/lib/config';
import { PROVINCIES } from '@/lib/nest';
import { POPULAIRE_RASSEN, landingVoor, type Landing } from '@/lib/landing';

/**
 * Footer op elke pagina, met linkjes naar de vaste ras- en provinciepagina's (/kittens/maine-coon,
 * /kittens/noord-holland). Die pagina's bestonden al (voor Google en de zoekfilters), maar werden
 * verder nergens in de site met een echte link aangewezen. Deze footer lost dat op.
 */
export default function Voet() {
  const rassen = POPULAIRE_RASSEN.map((r) => landingVoor('ras', r)).filter((l): l is Landing => Boolean(l));
  const provincies = PROVINCIES.map((p) => landingVoor('provincie', p)).filter((l): l is Landing => Boolean(l));

  return (
    <footer className="voet">
      <div className="voet-kolommen">
        <div className="voet-merk">
          <Link href="/" className="voet-logo">Nestje</Link>
          <p>Eén pagina per nestje kittens: wie nog vrij is, wanneer ze mogen verhuizen, en direct contact met de verkoper.</p>
        </div>

        <nav className="voet-kolom" aria-label="Populaire rassen">
          <h2>Populaire rassen</h2>
          <ul>
            {rassen.map((l) => (
              <li key={l.slug}>
                <Link href={`/kittens/${l.slug}`}>{l.naam} kittens</Link>
              </li>
            ))}
          </ul>
          <Link href="/kittens" className="voet-alles">Alle rassen ›</Link>
        </nav>

        <nav className="voet-kolom" aria-label="Provincies">
          <h2>Provincies</h2>
          <ul>
            {provincies.map((l) => (
              <li key={l.slug}>
                <Link href={`/kittens/${l.slug}`}>Kittens in {l.naam}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="voet-kolom" aria-label="Informatie">
          <h2>Informatie</h2>
          <ul>
            <li><Link href="/kittens">Kittens te koop</Link></li>
            <li><Link href="/catteries">Catteries</Link></li>
            <li><Link href="/verkopen">Zelf kittens verkopen</Link></li>
            <li><Link href="/huisregels">Huisregels</Link></li>
            <li><Link href="/hulp">Hulp</Link></li>
            <li><Link href="/login">Inloggen</Link></li>
          </ul>
        </nav>
      </div>

      <div className="voet-onder">
        <span>
          Gemaakt met <Link href="/">Nestje</Link> van{' '}
          <a href={metUtm(CONFIG.moederSiteUrl, 'voet')}>kattenverzorging.com</a>
        </span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/voorwaarden">Voorwaarden</Link>
      </div>
    </footer>
  );
}
