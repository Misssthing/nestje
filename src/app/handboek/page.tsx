import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';

export const metadata: Metadata = {
  title: 'Handboek voor verkopers',
  description: 'Zo werkt Nestje van begin tot eind: inloggen, je nestje aanmaken, delen, en contact met kopers via de wachtlijst.',
};

export default function Handboek() {
  return (
    <main className="wrap tekst">
      <div className="bar">
        <Link href="/kittens" className="brand">Nestje</Link>
      </div>
      <h1>Handboek voor verkopers</h1>
      <p className="lead">
        Alles wat je moet weten om je nestje te plaatsen en kopers te vinden — van inloggen tot de laatste kitten die
        verhuist. Lees dit rustig één keer door; je hoeft er daarna niet meer naar terug.
      </p>

      <h2>1. Inloggen</h2>
      <p>
        Nestje werkt zonder wachtwoord. Je vult je e-mailadres in en krijgt een mail met een inloglink. Nieuw? Dan maakt
        die link meteen je account aan — je hoeft niets apart te registreren. Kom je terug, dan log je op precies
        dezelfde manier in: gewoon je e-mailadres, geen apart “inloggen”-scherm met wachtwoord.
      </p>
      <figure className="scherm">
        <img src="/handboek/inloggen.png" alt="Het inlogscherm van Nestje, met een veld voor je e-mailadres" />
        <figcaption>Inloggen gaat altijd met je e-mailadres, nooit met een wachtwoord.</figcaption>
      </figure>
      <p>
        Een inloglink werkt één keer en één uur lang. Werkt hij niet meer, vraag dan gewoon een nieuwe aan. Zet Nestje
        na het inloggen op je beginscherm (via het deelicoontje van je browser), dan open je het voortaan met één tik
        en blijf je ingelogd zolang je dezelfde browser gebruikt. Zie <Link href="/hulp">Hulp</Link> voor de stappen per
        toestel.
      </p>

      <h2>2. Over jou en je profielpagina</h2>
      <p>
        Vul ook je naam of catteryname in, en eventueel een foto en een stukje over jezelf. Kopers vertrouwen een
        verkoper die ze een beetje kennen, en dit stukje komt op je profielpagina en als blokje "Over de verkoper"
        bij al je nestjes.
      </p>
      <p>
        Je profielpagina heeft één vaste link, met daarop al je lopende nestjes bij elkaar. Handig om bijvoorbeeld
        in je WhatsApp-status of op Instagram te zetten: die link blijft hetzelfde, ook als je later een nieuw
        nestje aanmaakt.
      </p>
      <figure className="scherm">
        <img src="/handboek/profielpagina.png" alt="Het profiel met naam, foto, je vaste link en een stukje over jou" />
        <figcaption>Dit vul je één keer in; het geldt voor al je nestjes.</figcaption>
      </figure>

      <h2>3. Je nestje aanmaken</h2>
      <p>
        Vul de naam van de moeder in, haar foto, en de geboortedatum. Zijn de kittens nog niet geboren? Vul dan de
        uitgerekende datum in: je pagina telt dan af, en kopers kunnen alvast laten weten dat ze interesse hebben. Zodra
        de kittens er zijn, pas je de datum aan en voeg je ze toe — je link blijft hetzelfde.
      </p>
      <p>
        Nestje heeft een paar <Link href="/huisregels">huisregels</Link> om kittens verantwoord te laten verhuizen,
        zoals een minimumleeftijd en een rasnaam alleen met stamboom. Kun je iets niet opslaan, dan zie je onderaan
        “Gegevens” altijd de reden.
      </p>

      <h2>4. Foto's en gegevens aanvullen</h2>
      <p>
        Een checklist op je nestje laat zien wat er nog mist: de foto van de moeder, foto's per kitten, de prijs, je
        WhatsApp-nummer. Reken op zo'n 10 minuten voor de hele lijst, en dat hoeft niet in één keer. Foto's worden
        automatisch verkleind, dus je kiest ze gewoon uit je eigen fotoalbum.
      </p>
      <figure className="scherm">
        <img src="/handboek/checklist.png" alt="De checklist bij een nestje, die laat zien wat er nog mist" />
        <figcaption>Deze checklist staat bovenaan je nestje en laat precies zien wat er nog mist.</figcaption>
      </figure>
      <figure className="scherm">
        <img src="/handboek/nestfotos.png" alt="Een nestfoto met de kittens die bij hun moeder drinken" />
        <figcaption>Een nestfoto zegt vaak meer dan duizend woorden — ook eentje als deze mag.</figcaption>
      </figure>
      <p>
        Je WhatsApp-nummer staat nergens als tekst op je pagina. Kopers tikken op een knop en WhatsApp opent vanzelf
        met jouw nummer, maar ze kunnen het nummer zelf niet aflezen of kopiëren.
      </p>
      <figure className="scherm">
        <img src="/handboek/contact-en-prijs.png" alt="Het veld voor je WhatsApp-nummer en de prijs per kitten" />
        <figcaption>Je vult je WhatsApp-nummer hier één keer in, bij “Contact en prijs”.</figcaption>
      </figure>

      <h2>5. Je pagina delen</h2>
      <p>
        Tik op “Link kopiëren” en plak hem in WhatsApp, op Facebook of in een buurtgroep. In WhatsApp en op Facebook
        verschijnt er automatisch een mooie afbeelding bij, met je nestje erop. Op Marktplaats mag je geen link naar
        een andere site in je advertentie zetten; plaats daar een gewone advertentie en stuur de link pas als iemand
        reageert.
      </p>
      <p>
        Wil je ook gevonden worden door mensen die nog geen link van je hebben? Zet dan “Tonen in het overzicht” aan
        bij Gegevens. Je nestje staat dan op nestje.kattenverzorging.com/kittens, ook te vinden via Google, zonder dat
        je telefoonnummer zichtbaar wordt.
      </p>

      <h2>6. Hoe kopers contact zoeken</h2>
      <p>
        Daar zijn twee wegen voor, en het is goed om het verschil te kennen:
      </p>
      <p>
        <strong>De knop “Vraag naar …”</strong> bij een los kitten opent meteen WhatsApp bij de koper, met jouw nummer
        al ingevuld. Dat gaat helemaal buiten Nestje om: alsof iemand je zomaar appt.
      </p>
      <p>
        <strong>De wachtlijst</strong> (de knop “Interesse in dit nestje” of “Vraag naar …” als er nog geen los kitten
        gekozen kan worden) is iets anders: de koper vult een klein formulier in en komt op een lijst te staan die
        alleen jij beheert. De koper hoeft daarvoor geen account te maken. Hierover gaat de rest van dit hoofdstuk.
      </p>

      <h2>7. De wachtlijst</h2>
      <p>
        Iedereen die zich aanmeldt via de knop op je pagina komt op je wachtlijst, onder “Wachtlijst” in je beheer. Jij
        kiest zelf wie je een kitten aanbiedt. Zegt iemand ja, dan reserveer je dat kitten voor die persoon; zegt
        iemand nee of reageert hij niet binnen 72 uur, dan gaat het kitten vanzelf terug naar de volgende die je kiest.
      </p>
      <p>
        <strong>Nestje stuurt automatisch mails</strong> bij elke stap: bevestiging van de aanmelding, een mail zodra
        jij een kitten aanbiedt, een mail bij ja of nee, en een herinnering als je zelf een tijdje niets hebt gedaan.
        Is je nestje vol of rond je het af, dan krijgen de mensen die nog wachten automatisch een mail met een paar
        andere nestjes van hetzelfde ras, van jou of van andere verkopers.
      </p>
      <p>
        <strong>Belangrijk: Nestje stuurt zelf nooit een bericht namens jou, en heeft geen chatfunctie.</strong> De
        mail- en WhatsApp-linkjes bij elke naam op je wachtlijst openen steeds jouw eigen mailprogramma of WhatsApp.
        Beantwoord je de mail die je van Nestje krijgt over een nieuwe aanmelding, dan gaat je antwoord rechtstreeks
        naar die koper — niet naar Nestje.
      </p>
      <p>
        Hoorde iemand erbij via een ander kanaal, bijvoorbeeld WhatsApp, Marktplaats of gewoon mondeling? Voeg diegene
        dan zelf toe via “+ Zelf iemand toevoegen” onder je wachtlijst. Zo staat iedereen op dezelfde lijst, en kun je
        voor zo iemand later zelf direct een kitten reserveren. Zo'n handmatig toegevoegde persoon krijgt nooit mail
        van Nestje; het contact loopt dan helemaal via jou.
      </p>
      <p>
        Bij elke naam kun je ook een <strong>aantekening</strong> bijhouden die alleen jij ziet, bijvoorbeeld “gebeld op
        3 november, wil liever wachten op een kater”.
      </p>
      <figure className="scherm">
        <img src="/handboek/wachtlijst.png" alt="Een wachtlijst-rij met naam, e-mail, voorkeur en een aantekening die alleen de verkoper ziet" />
        <figcaption>Zo ziet een aanmelding op je wachtlijst eruit, met de aantekening erbij.</figcaption>
      </figure>

      <h2>8. Status bijhouden</h2>
      <p>
        Tik bij een kitten op “Optie”, “Gereserveerd” of “Verhuisd”. Kopers zien dat direct op je pagina. Bij “Optie”
        kunnen anderen nog naar het kitten vragen, als reserve. Bij “Gereserveerd” en “Verhuisd” verschijnt er een
        notitieveld dat alleen jij ziet, bijvoorbeeld voor de naam van de koper.
      </p>
      <figure className="scherm">
        <img src="/handboek/kitten-status.png" alt="Een kittenkaart met de statusknoppen Vrij, Optie, Gereserveerd en Verhuisd" />
        <figcaption>Eén tik op de status, en kopers zien het meteen op je pagina.</figcaption>
      </figure>

      <h2>9. Nestje afronden of verwijderen</h2>
      <p>
        Zijn alle kittens verhuisd, kies dan onderaan je nestje voor “Nestje afsluiten”. Je pagina blijft bestaan en
        laat zien dat alle kittens een thuis hebben. Met “Nestje verwijderen” zijn je pagina en alle foto's direct weg
        — gebruik dat alleen als je de pagina helemaal niet meer wilt laten bestaan.
      </p>
      <figure className="scherm">
        <img src="/handboek/nestje-afsluiten.png" alt="Het blok “Nestje afsluiten of verwijderen” onderaan een nestje" />
        <figcaption>Onderaan je nestje vind je de knoppen om af te sluiten of te verwijderen.</figcaption>
      </figure>

      <section className="klaar">
        <h2>Kom je er toch niet uit?</h2>
        <p>Bekijk de losse vragen en antwoorden op de hulppagina, of mail ons.</p>
        <Link className="btn accent" href="/hulp">Naar Hulp</Link>
      </section>

      <Voet />
    </main>
  );
}
