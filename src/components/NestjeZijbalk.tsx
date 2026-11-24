import Link from 'next/link';
import KopieerLink from './KopieerLink';
import SocialIcoon from './SocialIcoon';
import { fotoUrl } from '@/lib/config';

type Props = {
  naam: string;
  profielSlug: string | null;
  chipTekst: string;
  sindsJaar: number | null;
  vrijeKittens: number;
  totaalKittens: number;
  paginaUrl: string;
  whatsappDeelTekst: string;
  foto: string | null;
  tekst: string | null;
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
  foto,
  tekst,
}: Props) {
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${whatsappDeelTekst} ${paginaUrl}`)}`;
  // Alleen een "Welkom namens ..." met foto tonen als de verkoper echt een eigen naam heeft ingevuld.
  // Is dat niet zo, dan is naam toch al gelijk aan chipTekst ("Fokker"/"Particulier") en zou dat er
  // dubbel op staan.
  const gepersonaliseerd = naam !== chipTekst;

  return (
    <div className="nzijbalk">
      {gepersonaliseerd ? (
        <div className="nzijbalk-foto-rij">
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="nzijbalk-foto" src={fotoUrl(foto)} alt="" />
          ) : (
            <div className="nzijbalk-foto placeholder" aria-hidden="true">{naam.charAt(0).toUpperCase()}</div>
          )}
          <p className="nzijbalk-welkom">
            Welkom namens {profielSlug ? <Link href={`/van/${profielSlug}`}><strong>{naam}</strong></Link> : <strong>{naam}</strong>}
          </p>
        </div>
      ) : (
        <p className="nzijbalk-naam">{profielSlug ? <Link href={`/van/${profielSlug}`}>{naam}</Link> : naam}</p>
      )}
      <span className="chip verkoper">{chipTekst}</span>
      {gepersonaliseerd && tekst && <p className="nzijbalk-bio">{tekst}</p>}
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
          <SocialIcoon soort="whatsapp" maat={16} />
          <span>WhatsApp</span>
        </a>
        <KopieerLink url={paginaUrl} className="btn ghost klein" />
      </div>
    </div>
  );
}
