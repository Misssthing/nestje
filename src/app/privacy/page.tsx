import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';
import { CONFIG } from '@/lib/config';

export const metadata: Metadata = { title: 'Privacyverklaring' };

export default function Privacy() {
  return (
    <main className="wrap tekst">
      <div className="bar"><Link href="/" className="brand">Nestje</Link></div>
      <h1>Privacyverklaring</h1>
      <p className="concept">Concepttekst, nog niet juridisch gecontroleerd. Velden tussen [blokhaken] invullen vóór livegang.</p>
      <p>Versie: [datum]</p>

      <h2>Wie zijn wij</h2>
      <p>
        Nestje is een gratis dienst van kattenverzorging.com, [handelsnaam / naam eigenaar], [adres], KvK-nummer [nummer].
        Wij zijn verwerkingsverantwoordelijke voor de persoonsgegevens die via Nestje worden verwerkt. Vragen over privacy
        stuur je naar <a href={`mailto:${CONFIG.contactEmail}`}>{CONFIG.contactEmail}</a>.
      </p>

      <h2>Welke gegevens we verwerken</h2>
      <p><strong>Van verkopers:</strong></p>
      <ul>
        <li>Je e-mailadres, om je te laten inloggen met een inloglink.</li>
        <li>De gegevens van je nestje die je zelf invult: naam en beschrijving van de moeder en (optioneel) de vader, woonplaats, geboortedatum, prijs, namen, kenmerken en karakteromschrijvingen van de kittens, en foto's van het nestje en de kittens.</li>
        <li>Je WhatsApp-nummer, zodat kopers contact met je kunnen opnemen.</li>
        <li>Technische gegevens die nodig zijn om de dienst te laten werken en te beveiligen, zoals IP-adres en tijdstip van inloggen (logbestanden van onze hostingpartijen).</li>
      </ul>
      <p><strong>Van bezoekers van een nestjespagina:</strong> wij verzamelen geen persoonsgegevens. Onze hostingpartijen houden korte tijd technische logbestanden bij (zoals IP-adres) voor beveiliging. Tik je op "Vraag naar …", dan open je WhatsApp en val je onder de voorwaarden en het privacybeleid van WhatsApp.</p>

      <h2>Wat openbaar is</h2>
      <p>
        Alles wat je op je nestjespagina zet, is te zien voor iedereen die de link heeft: gegevens over de ouders, woonplaats,
        geboortedatum, prijs, kittens en foto's. Je e-mailadres is nooit zichtbaar. Je WhatsApp-nummer staat niet als
        tekst op de pagina, maar wie op "Vraag naar …" tikt, ziet je nummer in WhatsApp. Dat is nodig om contact te kunnen
        opnemen. Zet daarom geen adres, achternaam of herkenbare details van je huis in teksten of op foto's als je dat niet wilt delen.
      </p>
      <p>Nestjespagina's worden niet aangeboden aan zoekmachines.</p>

      <h2>Waarom we dit doen (grondslag)</h2>
      <p>
        We verwerken je gegevens om de dienst te leveren die je zelf aanvraagt (uitvoering van de overeenkomst, art. 6 lid 1 sub b AVG)
        en om de dienst veilig te houden (gerechtvaardigd belang, art. 6 lid 1 sub f AVG).
      </p>

      <h2>Met wie we gegevens delen</h2>
      <ul>
        <li>Supabase (database, inloggen en opslag van foto's), servers in [regio, bijv. Frankfurt, EU].</li>
        <li>Vercel (hosting van de website). Vercel kan gegevens verwerken buiten de EU; doorgifte gebeurt op basis van het EU-VS Data Privacy Framework en/of standaardcontractbepalingen.</li>
        <li>[E-maildienst voor inlogmails, bijv. Resend / Brevo], voor het versturen van inlogmails.</li>
      </ul>
      <p>Met deze partijen hebben we verwerkersovereenkomsten. We verkopen je gegevens niet en gebruiken ze niet voor advertenties.</p>

      <h2>Cookies</h2>
      <p>
        Nestje gebruikt alleen functionele cookies die nodig zijn om je ingelogd te houden. Er zijn geen tracking- of
        advertentiecookies. [Aanpassen als er later statistieken worden toegevoegd.]
      </p>

      <h2>Hoe lang we gegevens bewaren</h2>
      <p>
        Je gegevens blijven bewaard zolang je nestje en account bestaan. Verwijder je je nestje, dan verwijderen we direct
        de pagina en de foto's. Je account (e-mailadres) verwijderen we op verzoek. [Overweeg: accounts zonder activiteit na
        12 maanden automatisch verwijderen.] Back-ups worden na [30] dagen overschreven.
      </p>

      <h2>Je rechten</h2>
      <p>
        Je hebt recht op inzage, correctie, verwijdering, beperking, overdraagbaarheid en bezwaar. Stuur een mail naar{' '}
        <a href={`mailto:${CONFIG.contactEmail}`}>{CONFIG.contactEmail}</a>; we reageren binnen een maand. Ben je niet tevreden
        over hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens.
      </p>

      <h2>Beveiliging</h2>
      <p>
        Verbindingen zijn versleuteld (https). Alleen jij kunt je nestje wijzigen; dat wordt in de database zelf afgedwongen.
        Inloggen gaat zonder wachtwoord, via een eenmalige link of code.
      </p>

      <h2>Wijzigingen</h2>
      <p>We kunnen deze verklaring aanpassen. De datum bovenaan laat zien wanneer dat voor het laatst gebeurde.</p>
      <Voet />
    </main>
  );
}
