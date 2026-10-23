import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';
import { CONFIG } from '@/lib/config';

export const metadata: Metadata = { title: 'Hulp' };

const VRAGEN: { v: string; a: React.ReactNode }[] = [
  {
    v: 'Ik krijg geen inlogmail',
    a: (
      <>
        <p>Kijk in je map Ongewenst of Spam, en bij Hotmail of Outlook ook in het tabblad Overige. Je kunt ook in je mailbox zoeken op “Nestje”. De mail komt van {CONFIG.contactEmail} en kan een paar minuten onderweg zijn.</p>
        <p>Staat hij bij Ongewenst? Markeer hem dan als “Geen ongewenste e-mail”, dan komt de volgende mail gewoon in je inbox. Controleer ook of je e-mailadres zonder tikfout is ingevuld.</p>
      </>
    ),
  },
  {
    v: 'De inloglink werkt niet',
    a: (
      <p>Een inloglink werkt één keer en één uur lang. Gebruik in plaats daarvan de code uit dezelfde mail: vul die in op het inlogscherm, direct na “Stuur inloglink”. Werkt ook dat niet, vraag dan een nieuwe mail aan en gebruik alleen die nieuwste.</p>
    ),
  },
  {
    v: 'Inloggen op mijn telefoon',
    a: (
      <>
        <p>Open de mail op je telefoon en tik op de knop. Gebruik je de Gmail-app of een andere mail-app, dan opent de link soms in een ingebouwde browser. Je bent dan alleen dáár ingelogd. Houd de knop in de mail ingedrukt en kies “Openen in Safari” of “Openen in Chrome”, of gebruik de code.</p>
        <p>Handig: zet Nestje daarna op je beginscherm via het deelknopje van je browser. Je blijft ingelogd zolang je dezelfde browser gebruikt.</p>
      </>
    ),
  },
  {
    v: "Foto's toevoegen of wijzigen",
    a: (
      <p>Tik bij een kitten op het vakje met het plusje. Je kunt per kitten 5 foto’s toevoegen en voor het hele nestje 3 nestfoto’s. De eerste foto is de omslag; met de knop “Omslag” zet je een andere foto vooraan. Foto’s worden automatisch verkleind, dus je kunt ze gewoon uit je fotoalbum kiezen.</p>
    ),
  },
  {
    v: 'Een kitten op gereserveerd zetten',
    a: (
      <p>Tik bij het kitten op “Gereserveerd” of “Verhuisd”. Kopers zien dat direct op je pagina, en de knop “Vraag naar …” verdwijnt. Er verschijnt dan ook een notitieveld dat alleen jij ziet, bijvoorbeeld voor de naam van de koper.</p>
    ),
  },
  {
    v: 'Kopers kunnen me niet bereiken',
    a: (
      <p>Controleer of je WhatsApp-nummer is ingevuld bij Gegevens. Zonder nummer verschijnt de knop “Vraag naar …” niet. De knop staat alleen bij kittens die nog vrij zijn.</p>
    ),
  },
  {
    v: 'Waar deel ik mijn link?',
    a: (
      <>
        <p>Tik in je beheer op “Link kopiëren” en plak hem in WhatsApp, op Facebook, in een buurtgroep of waar je maar wilt. In WhatsApp en op Facebook verschijnt automatisch een afbeelding met je nestje.</p>
        <p>Op Marktplaats zijn links naar andere websites in een advertentie niet zomaar toegestaan. Zet daar een gewone advertentie neer en stuur de link pas als iemand reageert.</p>
      </>
    ),
  },
  {
    v: 'Mijn nestje verwijderen',
    a: (
      <p>Klap in je beheer onderaan “Account” open en kies “Nestje verwijderen”. Je pagina en alle foto’s zijn daarna direct weg. Wil je ook je account laten verwijderen, mail ons dan.</p>
    ),
  },
];

export default function Hulp() {
  return (
    <main className="wrap tekst">
      <div className="bar">
        <Link href="/" className="brand">Nestje</Link>
      </div>
      <h1>Hulp</h1>
      <p>Antwoorden op de vragen die we het vaakst krijgen.</p>

      <div className="lijst" style={{ marginTop: 22 }}>
        {VRAGEN.map(({ v, a }) => (
          <details key={v} className="panel" style={{ margin: 0 }}>
            <summary style={{ fontSize: 18 }}>{v}</summary>
            <div className="hulp-antwoord">{a}</div>
          </details>
        ))}
      </div>

      <section className="klaar">
        <h2>Kom je er niet uit?</h2>
        <p>Stuur een mail met je vraag. Een screenshot helpt ons om snel te zien wat er aan de hand is.</p>
        <a className="btn accent" href={`mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent('Hulp met Nestje')}`}>
          Mail {CONFIG.contactEmail}
        </a>
      </section>

      <Voet />
    </main>
  );
}
