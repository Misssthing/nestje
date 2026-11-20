import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Voet from '@/components/Voet';
import { haalNestje } from '../../data';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string; kittenId: string }> };

/**
 * Kort tussenstapje vóór het WhatsApp-bericht (uitbreiding 39). Geen database, geen opslag: de
 * toelichting gaat alleen mee in de querystring naar /verstuur, die 'm in het WhatsApp-bericht
 * plakt. Bewust niet verplicht (zie de "direct doorgaan"-link) om geen serieuze kopers af te
 * schrikken — het is bedoeld om impulscontacten een drempeltje te geven en de verkoper vast wat
 * context te sturen.
 */
export default async function VraagPagina({ params }: Props) {
  const { slug, kittenId } = await params;
  if (!/^[a-z0-9-]{4,40}$/.test(slug)) redirect('/kittens');

  const data = await haalNestje(slug);
  if (!data) redirect('/kittens');
  const kitten = data.kittens.find((k) => k.id === kittenId);
  if (!kitten) redirect(`/n/${slug}`);

  const actie = `/n/${slug}/vraag/${kittenId}/verstuur`;

  return (
    <main className="wrap tekst">
      <div className="bar">
        <Link href={`/n/${slug}`} className="brand">Nestje</Link>
      </div>

      <h1>Vraag naar {kitten.naam}</h1>
      <p>
        Vertel in een paar woorden iets over jezelf — bijvoorbeeld je woonsituatie en ervaring met
        katten. Dit komt in je eerste bericht aan de verkoper mee.
      </p>

      <form className="panel" method="get" action={actie}>
        <fieldset className="veld wl-voorkeur">
          <legend>Heb je zelf al katten? (optioneel)</legend>
          <div className="seg" role="radiogroup" aria-label="Heb je zelf al katten?">
            {[['ja', 'Ja'], ['nee', 'Nee']].map(([v, l]) => (
              <label key={v} className="wl-keuze">
                <input type="radio" name="heeft_katten" value={v} />
                <span>{l}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="veld">
          <span>Over mij (optioneel)</span>
          <textarea
            name="toelichting"
            maxLength={300}
            placeholder="Bijv.: we wonen in een huis met tuin en hebben al eerder een kat gehad…"
          />
        </label>
        <div className="actions">
          <button className="btn primary">Verder naar WhatsApp</button>
        </div>
      </form>

      <p className="hint">
        <a href={actie}>Liever direct doorgaan, zonder toelichting →</a>
      </p>

      <Voet />
    </main>
  );
}
