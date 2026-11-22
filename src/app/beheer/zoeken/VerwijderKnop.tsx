'use client';

import { verwijderNestje } from './acties';

/** Los formuliertje met bevestiging, want dit verwijdert een nestje van wie dan ook, direct en definitief. */
export default function VerwijderKnop({ id, q, moederNaam }: { id: string; q: string; moederNaam: string }) {
  return (
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
  );
}
