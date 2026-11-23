import type { Metadata } from 'next';
import Link from 'next/link';
import { CONFIG, metUtm } from '@/lib/config';
import LeesOok from '@/components/LeesOok';
import Voet from '@/components/Voet';

export const metadata: Metadata = {
  title: 'Kitten reserveren voor de geboorte',
  description:
    'Wacht je op een nestje dat nog geboren moet worden? Lees waar je op moet letten, welke vragen je stelt, en hoe je een serieuze fokker herkent.',
  alternates: { canonical: '/kitten-reserveren' },
};

export default function KittenReserveren() {
  return (
    <main className="wrap tekst">
      <div className="bar">
        <Link href="/kittens" className="brand">Nestje</Link>
      </div>
      <nav className="kruimel" aria-label="Kruimelpad">
        <Link href="/kenniscentrum">Kenniscentrum</Link> <span aria-hidden="true">›</span> <span>Een kitten reserveren</span>
      </nav>

      <h1>Een kitten reserveren voor hij geboren is</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="artikel-hero" src="/kenniscentrum/kitten-reserveren.jpg" alt="" />
      <p className="lead">
        Wacht je op een nestje dat nog geboren moet worden? Een plekje op een interesselijst is dan nog geen garantie.
        Deze gids helpt je door elke fase heen: waar je op moet letten, welke vragen je kunt stellen, en hoe je een
        serieuze fokker herkent.
      </p>

      <h2>In welke fase zit het nestje?</h2>
      <ul>
        <li><strong>Nog niet gedekt.</strong> Er is nog geen bevestigde dracht — een plek op een interesselijst is vrijblijvend.</li>
        <li><strong>Drachtig.</strong> De dracht is bevestigd, vaak met een echo. De geboortedatum is nog een schatting.</li>
        <li><strong>Geboren.</strong> Het nestje is er, de verdeling van kittens begint pas echt serieus te worden.</li>
      </ul>

      <h2>Hoe vind je een nestje?</h2>
      <p>
        Via Facebookgroepen, Marktplaats, cattery-websites, of een pagina zoals deze. Kijk altijd verder dan alleen de
        foto&apos;s: wat vertelt de verkoper over de ouderdieren, de gezondheidstesten en de leefomstandigheden?
      </p>

      <h2>Wat vertel en vraag je?</h2>
      <ul>
        <li>Vraag naar gezondheidstesten van beide ouderdieren, en wanneer de laatste test was.</li>
        <li>Vraag of je de moeder (en het liefst ook de vader) kunt zien of spreken, of videobellen als bezoek nog niet kan.</li>
        <li>Vertel zelf ook iets over je situatie — een serieuze verkoper wil weten waar een kitten terechtkomt.</li>
      </ul>

      <h2>Wachtlijst en aanbetaling</h2>
      <p>
        Een aanbetaling is gebruikelijk om een reservering vast te leggen, meestal pas ná de geboorte, als duidelijk is
        welke kittens er zijn. Een verkoper die vóór de dekking al een aanbetaling vraagt, verdient extra aandacht.
      </p>

      <h2>Rode vlaggen</h2>
      <ul className="vlaggen">
        <li>Meerdere nestjes tegelijk, van verschillende rassen of moeders.</li>
        <li>Je mag de moeder niet zien, en vragen daarover worden ontweken.</li>
        <li>Druk om snel te beslissen of te betalen.</li>
        <li>Geen enkele gezondheidstest, zonder uitleg waarom niet.</li>
      </ul>

      <h2>Goede tekenen</h2>
      <ul className="tekenen">
        <li>De verkoper stelt zelf ook vragen aan jou.</li>
        <li>Open over gezondheidstesten, ook als een uitslag niet perfect is.</li>
        <li>Bereid om te videobellen of je op bezoek te laten komen.</li>
      </ul>

      <h2>Voor je reserveert</h2>
      <p>
        Spreek af wat er gebeurt als het nestje kleiner is dan verwacht, of als een kitten toch niet gezond blijkt.
        Een duidelijke afspraak vooraf voorkomt teleurstelling achteraf.
      </p>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Zo doet Nestje dat</h2>
        <p>
          Op Nestje kun je je aanmelden voor een <Link href="/wachtlijst/ras">wachtlijst per ras</Link>, zodat je een
          seintje krijgt zodra er een passend nestje bij is. Onze <Link href="/huisregels">huisregels</Link> leggen uit
          wat we van verkopers verwachten, zoals een eerlijke beschrijving en echte foto&apos;s.
        </p>
      </div>

      <section className="klaar">
        <h2>Klaar voor je kitten?</h2>
        <p>Bekijk alle nestjes die nu op Nestje staan, of meld je aan voor een wachtlijst.</p>
        <a className="btn accent" href={metUtm(CONFIG.kopenArtikelUrl, 'reserveren')} target="_blank" rel="noopener">
          Starterslijst voor nieuwe kittenbezitters ↗
        </a>
      </section>

      <LeesOok huidige="/kitten-reserveren" />

      <Voet />
    </main>
  );
}
