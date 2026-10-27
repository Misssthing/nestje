import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';

export const metadata: Metadata = {
  title: 'Huisregels',
  description: 'De huisregels van Nestje: zo zorgen we samen dat kittens verantwoord verhuizen.',
};

export default function Huisregels() {
  return (
    <main className="wrap tekst">
      <div className="bar">
        <Link href="/kittens" className="brand">Nestje</Link>
      </div>
      <h1>Huisregels</h1>
      <p>
          Iedereen die verantwoord een nestje kittens laat verhuizen, is welkom op Nestje. Of je nu fokker bent met stamboom,
        of een keer een nestje hebt van je eigen poes. Voor broodfok is geen plek. Deze regels gelden voor elk nestje.
      </p>

        <h2>1. Gezond op weg</h2>
        <p>
          Kittens zijn gechipt en hebben minstens hun eerste enting gehad voordat ze verhuizen. In Nestje kun je een kitten pas
          op “Verhuisd” zetten als dat is aangevinkt. Waarom? Met een chip vindt een kitten dat zoekraakt zijn weg terug naar
          huis, en de eerste enting beschermt tegen ziektes die voor jonge kittens heel gevaarlijk zijn.
        </p>

        <h2>2. Niet te jong</h2>
        <p>
          Kittens verhuizen op zijn vroegst als ze 12 weken oud zijn. Valt je nestje onder een vereniging met een strengere regel,
          zoals 14 weken bij FIFe, dan volg je die. Waarom? Tussen 8 en 12 weken leert een kitten bij zijn moeder en
          nestgenootjes spelen zonder te bijten en omgaan met andere katten. Kittens die te vroeg weggaan, hebben vaker last van
          angst of gedragsproblemen. Bovendien hebben ze met 12 weken hun eerste twee entingen gehad.
        </p>

        <h2>3. De moeder in beeld</h2>
        <p>
          Op je nestjespagina staat een foto van de moeder, en dat is ook echt de moeder van dit nestje. Het liefst een foto van
          haar samen met haar kittens. Zonder foto van de moeder verschijnt je nestje niet in het overzicht. Bij een
          vondelingennestje, waarvan de moeder onbekend is, maken we een uitzondering. Die nestjes krijgen het label “Vondelingen”.
        </p>

        <h2>4. Een rasnaam alleen met stamboom</h2>
        <p>
          Een rasnaam zoals Maine Coon of Brits korthaar gebruik je alleen als de kittens een stamboom hebben. Je vult dan de
          organisatie, je catterynaam en de stamboomnummers van moeder én vader in. Zonder stamboom is je kitten een huiskat of
          kruising, hoe mooi hij ook is.
        </p>
        <p>
          In je beschrijving mag je eerlijk vertellen hoe je kittens eruitzien, bijvoorbeeld: “De moeder heeft het uiterlijk van
          een Maine Coon, maar heeft geen stamboom.” Woorden als “raszuiver”, “rasecht” of “volbloed” gebruik je alleen met een
          stamboom. Zo weten kopers precies waar ze aan toe zijn.
        </p>

        <h2>5. Niet te vaak</h2>
        <p>
          Je hebt maximaal 2 lopende nestjes tegelijk, en maximaal 4 nestjes per 12 maanden. Een poes heeft maximaal 2 nestjes
          per 12 maanden en 3 per 24 maanden, zoals ook verenigingen voorschrijven. Vang je vaker vondelingen op, of ben je een
          opvang? Neem dan contact op, dan kijken we samen wat er kan.
        </p>

        <h2>6. Verboden rassen</h2>
        <p>
          In Nederland mag niet worden gefokt met naaktkatten, katten met vouworen zoals de Scottish Fold, en katten met een te
          korte snuit. Zulke nestjes kunnen niet op Nestje.
        </p>

        <h2>7. Eerlijk en samen opletten</h2>
        <p>
          Wat je over je kittens en hun ouders invult, klopt. Zie je een nestje dat niet aan deze regels voldoet, meld het dan via
          de link onderaan de nestjespagina. We bekijken elke melding. Houdt iemand zich niet aan de regels, dan halen we het
          nestje uit het overzicht en kunnen we het account afsluiten.
        </p>

      <Voet />
    </main>
  );
}
