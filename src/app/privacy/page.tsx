import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';
import { CONFIG } from '@/lib/config';

export const metadata: Metadata = { title: 'Privacyverklaring' };

const { bedrijf } = CONFIG;
const Mail = () => <a href={`mailto:${CONFIG.contactEmail}`}>{CONFIG.contactEmail}</a>;

export default function Privacy() {
  return (
    <main className="wrap tekst">
      <div className="bar"><Link href="/" className="brand">Nestje</Link></div>
      <h1>Privacyverklaring</h1>
      <p className="hint">Laatst bijgewerkt: {CONFIG.juridischBijgewerkt}</p>

      <h2>Wie zijn wij</h2>
      <p>
        Nestje is een dienst van {bedrijf.naam}, gevestigd in {bedrijf.plaats}, ingeschreven bij de Kamer van Koophandel
        onder nummer {bedrijf.kvk}. {bedrijf.naam} is ook de uitgever van kattenverzorging.com. Wij zijn
        verwerkingsverantwoordelijke voor de persoonsgegevens die via Nestje worden verwerkt. Vragen over privacy stuur je naar <Mail />.
      </p>

      <h2>Welke gegevens we verwerken</h2>
      <p><strong>Van verkopers:</strong></p>
      <ul>
        <li>Je e-mailadres, om je te laten inloggen met een inloglink of code.</li>
        <li>Wat je zelf over je nestje invult: woonplaats, geboortedatum van de kittens, prijs, en over de ouders naam, ras, gewicht, foto, beschrijving, stamboom en of ze getest zijn.</li>
        <li>Wat je over de kittens invult: namen, geslacht, vacht, karakter, status, gezondheidsgegevens (zoals chip en entingen) en foto’s.</li>
        <li>Je WhatsApp-nummer, zodat kopers contact met je kunnen opnemen.</li>
        <li>Notities die je bij een kitten maakt, bijvoorbeeld voor wie het gereserveerd is. Die zijn alleen voor jou zichtbaar. Noteer over kopers niet meer dan je nodig hebt; je bent zelf verantwoordelijk voor wat je over anderen vastlegt.</li>
        <li>Technische gegevens die nodig zijn om de dienst te laten werken en te beveiligen, zoals IP-adres en tijdstip van inloggen, in de logbestanden van onze dienstverleners.</li>
      </ul>
      <p>
        <strong>Van bezoekers van een nestjespagina:</strong> wij verzamelen geen persoonsgegevens. Onze dienstverleners houden korte
        tijd technische logbestanden bij, zoals het IP-adres, voor de beveiliging. Tik je op “Vraag naar …”, dan open je WhatsApp
        en vallen je gegevens onder de voorwaarden en het privacybeleid van WhatsApp.
      </p>

      <h2>Wat openbaar is</h2>
      <p>
        Alles wat je op je nestjespagina zet, is te zien voor iedereen die de link heeft: woonplaats, geboortedatum, prijs, de
        gegevens en foto’s van de ouders, de kittens met hun kenmerken en gezondheidsgegevens, en de nestfoto’s. Je e-mailadres en
        je notities zijn nooit zichtbaar. Je WhatsApp-nummer staat niet als tekst op de pagina, maar wie op “Vraag naar …” tikt,
        ziet je nummer in WhatsApp; dat is nodig om contact te kunnen opnemen. Zet daarom geen adres, achternaam of herkenbare
        details van je huis in teksten of op foto’s als je dat niet wilt delen.
      </p>
      <p>Nestjespagina’s worden niet aangeboden aan zoekmachines.</p>

      <h2>Waarom we dit doen</h2>
      <p>
        We verwerken je gegevens om de dienst te leveren die je zelf aanvraagt (uitvoering van de overeenkomst, artikel 6 lid 1
        sub b AVG) en om de dienst veilig en werkend te houden (gerechtvaardigd belang, artikel 6 lid 1 sub f AVG).
      </p>

      <h2>Met wie we gegevens delen</h2>
      <ul>
        <li>
          <strong>Supabase</strong>, voor de database, het inloggen en de opslag van foto’s. De gegevens staan op servers in Londen
          (Verenigd Koninkrijk). De Europese Commissie heeft vastgesteld dat persoonsgegevens in het Verenigd Koninkrijk passend
          worden beschermd. Supabase is een Amerikaans bedrijf; voor eventuele doorgifte naar de Verenigde Staten gelden het
          EU-VS Data Privacy Framework en/of standaardcontractbepalingen.
        </li>
        <li>
          <strong>Vercel</strong>, voor de hosting van de website. Vercel kan gegevens verwerken in de Verenigde Staten; doorgifte
          gebeurt op basis van het EU-VS Data Privacy Framework en/of standaardcontractbepalingen.
        </li>
        <li><strong>Brevo</strong>, een Frans bedrijf, voor het versturen van de inlogmails vanuit de Europese Unie.</li>
      </ul>
      <p>Met deze partijen gelden verwerkersafspraken. We verkopen je gegevens niet en gebruiken ze niet voor advertenties.</p>

      <h2>Cookies</h2>
      <p>
        Nestje gebruikt alleen functionele cookies die nodig zijn om je ingelogd te houden. Er zijn geen tracking- of
        advertentiecookies.
      </p>

      <h2>Hoe lang we gegevens bewaren</h2>
      <p>
        Je gegevens blijven bewaard zolang je nestje en account bestaan. Verwijder je je nestje, dan verwijderen we direct de pagina
        en de foto’s. Je account (e-mailadres) verwijderen we op verzoek. Na verwijdering kunnen gegevens nog korte tijd in
        back-ups of logbestanden van onze dienstverleners staan, waarna ze automatisch worden gewist.
      </p>

      <h2>Je rechten</h2>
      <p>
        Je hebt recht op inzage, correctie, verwijdering, beperking, overdraagbaarheid en bezwaar. Stuur een mail naar <Mail />; we
        reageren binnen een maand. Ben je niet tevreden over hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de
        Autoriteit Persoonsgegevens.
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
