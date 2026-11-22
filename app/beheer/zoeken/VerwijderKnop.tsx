'use client';

import { verwijderNestje, wisselVerborgen } from './acties';

/** Losse formuliertjes met bevestiging: dit werkt op een nestje van wie dan ook, direct. */
export default function VerwijderKnop({
  id,
  q,
  moederNaam,
  verborgen,
}: {
  id: string;
  q: string;
  moederNaam: string;
  verborgen: boolean;
}) {
  return (
    <>
      <form
        action={wisselVerborgen}
        onSubmit={(e) => {
          const vraag = verborgen
            ? `Het nestje van ${moederNaam} weer online zetten?`
            : `Het nestje van ${moederNaam} verbergen? De pagina gaat dan helemaal offline (ook de eigen link), tot je 'm weer online zet.`;
          if (!confirm(vraag)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="q" value={q} />
        <input type="hidden" name="verborgen" value={verborgen ? '0' : '1'} />
        <button className="btn ghost klein" type="submit">{verborgen ? 'Weer online zetten' : 'Verbergen'}</button>
      </form>
      <form
        action={verwijderNestje}
        onSubmit={(e) => {
          if (!confirm(`Het nestje van ${moederNaam} helemaal verwijderen? Dat kan niet ongedaan worden.`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="q" value={q} />
        <button className="btn danger klein" type="submit">Verwijderen</button>
      </form>
    </>
  );
}
