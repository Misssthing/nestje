import Link from 'next/link';

const INSTAGRAM = 'https://www.instagram.com/nestjespagina/';
const MOEDERSITE = 'https://www.kattenverzorging.com/?utm_source=nestje&utm_medium=kop';

/** Bovenbalk op elke pagina: logo, "onderdeel van kattenverzorging.com" en Instagram. */
export default function SiteKop() {
  return (
    <header className="sitekop">
      <div className="sitekop-binnen">
        <div className="sitekop-merk">
        <Link href="/kittens" className="sitekop-logo" aria-label="Nestje, naar alle kittens">
          <picture>
            <source srcSet="/logo-nestje-donker.png" media="(prefers-color-scheme: dark)" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nestje.png" alt="Nestje" width={115} height={32} />
          </picture>
        </Link>
        <a className="sitekop-moeder" href={MOEDERSITE}>
          onderdeel van <strong>kattenverzorging.com</strong>
        </a>
        </div>
        <a className="sitekop-insta" href={INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Nestje op Instagram (@nestjespagina)">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
          </svg>
          <span>@nestjespagina</span>
        </a>
      </div>
    </header>
  );
}
