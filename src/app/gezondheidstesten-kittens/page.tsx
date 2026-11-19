import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';
import { TEST_UITLEG } from '@/lib/nest';

export const metadata: Metadata = {
  title: 'Gezondheidstesten bij kittens, uitgelegd',
  description:
    'Wat betekent een uitslag als "Drager"? Is een getest ouderdier een garantie voor de kitten? En hoe vaak moet een test herhaald worden? Gezondheidstesten bij kittens in gewone taal uitgelegd.',
  alternates: { canonical: '/gezondheidstesten-kittens' },
};

export default function GezondheidstestenKittens() {
  return (
    <main className="wrap tekst">
      <div className="bar">
        <Link href="/kittens" className="brand">Nestje</Link>
      </div>

      <h1>Gezondheidstesten bij kittens, uitgelegd</h1>
      <p>
        Bij veel rassen laten fokkers de ouderdieren testen op erfelijke aandoeningen. Op papier ziet dat er simpel uit — een
        testnaam en een uitslag — maar wat die uitslag precies betekent, blijft voor kopers vaak onduidelijk. Deze uitleg helpt
        je op weg.
      </p>

      <h2>Twee soorten testen</h2>
      <p>
        Een <strong>DNA-test</strong> kijkt naar het erfelijk materiaal van de kat en zoekt naar een specifieke, bekende
        mutatie die bij dat ras een aandoening veroorzaakt. Zo&apos;n test is <strong>eenmalig</strong>: het DNA van een kat
        verandert niet, dus de uitslag blijft z&apos;n hele leven geldig.
      </p>
      <p>
        Een <strong>lichamelijk onderzoek</strong>, zoals een hartecho door een cardioloog, kijkt naar de huidige toestand van
        het dier. Dat is een momentopname: de aandoening kan zich ook op latere leeftijd nog ontwikkelen, ook bij een kat
        zonder de bekende DNA-mutatie. Zo&apos;n onderzoek moet daarom <strong>periodiek herhaald</strong> worden, vaak
        jaarlijks.
      </p>

      <h2>Wat betekent de uitslag?</h2>
      <ul>
        <li><strong>Vrij / Negatief / Normaal</strong> — geen aanwijzing voor de aandoening gevonden.</li>
        <li>
          <strong>Drager</strong> — de kat heeft het gen, maar wordt er zelf niet ziek van. Dit is vooral relevant voor wie zelf
          wil fokken: een drager kan het gen doorgeven aan zijn kittens. Voor een kat die &ldquo;gewoon&rdquo; huisdier wordt, heeft een
          drager-uitslag in de praktijk meestal geen gevolgen.
        </li>
      </ul>

      <h2>Veelgebruikte testen, en wat ze controleren</h2>
      <p>
        Welke testen gebruikelijk zijn, verschilt per ras. Dit zijn de testen die je het vaakst tegenkomt op Nestje:
      </p>
      <dl className="rastekst-vragen">
        {Object.entries(TEST_UITLEG).map(([test, uitleg]) => (
          <div key={test}><dt>{test}</dt><dd>{uitleg}</dd></div>
        ))}
      </dl>

      <h2>Ouders getest, wat betekent dat voor de kitten?</h2>
      <p>
        De meeste testen worden bij de <strong>ouderdieren</strong> gedaan, niet bij de kitten zelf. Zijn beide ouders vrij van
        een aandoening, dan is de kans dat een kitten de aandoening ontwikkelt heel klein. Maar zelfs bij twee schone ouders kan
        een kitten in zeldzame gevallen toch drager zijn — dat hangt af van hoe de aandoening precies overerft. Twijfel je, vraag
        de fokker dan gerust om uitleg bij de uitslagen.
      </p>

      <h2>Geen testen ingevuld: is dat een probleem?</h2>
      <p>
        Niet per se. Testen kosten geld en tijd, en niet voor elk ras of elke aandoening bestaat een gestandaardiseerde test.
        Een ontbrekende test betekent dus niet automatisch dat er iets mis is. Vraag er gewoon naar: een fokker die het serieus
        neemt, legt graag uit wat wel en niet is getest, en waarom.
      </p>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Zo laat Nestje het zien</h2>
        <p style={{ marginBottom: 0 }}>
          Bij een nestje op Nestje zie je per test de uitslag, de datum en of Nestje de uitslag zelf heeft bekeken
          (&ldquo;Bekeken door Nestje&rdquo;) of dat die door de verkoper is opgegeven. Zo zie je in één oogopslag wat er is
          gecontroleerd, en waar je zelf nog naar kunt vragen.
        </p>
      </div>

      <section className="klaar">
        <h2>Op zoek naar een kitten?</h2>
        <p>Bekijk alle nestjes die nu op Nestje staan.</p>
        <Link className="btn accent" href="/kittens">Bekijk kittens →</Link>
      </section>

      <Voet />
    </main>
  );
}
