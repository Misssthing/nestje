import Link from 'next/link';
import KopieerLink from './KopieerLink';

type Props = {
  naam: string;
  profielSlug: string | null;
  chipTekst: string;
  sindsJaar: number | null;
  vrijeKittens: number;
  totaalKittens: number;
  paginaUrl: string;
  whatsappDeelTekst: string;
};

/** Compacte infokaart naast een nestje: wie het aanbiedt, hoeveel er nog vrij zijn, en delen. */
export default function NestjeZijbalk({
  naam,
  profielSlug,
  chipTekst,
  sindsJaar,
  vrijeKittens,
  totaalKittens,
  paginaUrl,
  whatsappDeelTekst,
}: Props) {
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${whatsappDeelTekst} ${paginaUrl}`)}`;

  return (
    <div className="nzijbalk">
      <p className="nzijbalk-naam">{profielSlug ? <Link href={`/van/${profielSlug}`}>{naam}</Link> : naam}</p>
      <span className="chip verkoper">{chipTekst}</span>
      {sindsJaar && <p className="nzijbalk-feit">Fokt sinds {sindsJaar}</p>}

      <div className="nzijbalk-stand">
        {totaalKittens > 0 ? (
          vrijeKittens > 0 ? (
            <p>
              <strong>{vrijeKittens}</strong> van de {totaalKittens} kittens nog vrij
            </p>
          ) : (
            <p>Alle kittens staan onder optie of zijn verhuisd</p>
          )
        ) : (
          <p>Nestje is nog niet geboren</p>
        )}
      </div>

      <p className="nzijbalk-kop">Deze pagina delen</p>
      <div className="nzijbalk-deel">
        <a className="btn ghost klein" href={whatsappUrl} target="_blank" rel="noopener">
          WhatsApp
        </a>
        <KopieerLink url={paginaUrl} className="btn ghost klein" />
      </div>
    </div>
  );
}
