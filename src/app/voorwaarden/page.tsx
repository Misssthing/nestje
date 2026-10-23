import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';
import { CONFIG } from '@/lib/config';

export const metadata: Metadata = { title: 'Gebruiksvoorwaarden' };

export default function Voorwaarden() {
  return (
    <main className="wrap tekst">
      <div className="bar"><Link href="/" className="brand">Nestje</Link></div>
      <h1>Gebruiksvoorwaarden</h1>
      <p className="concept">Concepttekst, nog niet juridisch gecontroleerd. Velden tussen [blokhaken] invullen vóór livegang.</p>
      <p>Versie: [datum]</p>

      <h2>1. Over Nestje</h2>
      <p>
        Nestje is een gratis online hulpmiddel van kattenverzorging.com, [handelsnaam], KvK [nummer], waarmee je een
        deelbare pagina maakt voor een nestje kittens. Door een account aan te maken ga je akkoord met deze voorwaarden.
      </p>

      <h2>2. Voor wie</h2>
      <p>
        Nestje is bedoeld voor particulieren die af en toe een nestje kittens hebben. Je moet 18 jaar of ouder zijn.
        [Bepaal of beroepsmatige fokkers zijn toegestaan.]
      </p>

      <h2>3. Jouw verantwoordelijkheid</h2>
      <ul>
        <li>Je bent zelf verantwoordelijk voor alles wat je op je pagina zet en voor de juistheid daarvan.</li>
        <li>Je zet alleen foto's en teksten online waarvoor je de rechten hebt.</li>
        <li>Je houdt je aan de wet- en regelgeving rond het houden, fokken en verkopen of herplaatsen van dieren, waaronder de regels over de minimale leeftijd waarop kittens bij de moeder weg mogen, identificatie en registratie. [Concreet nakijken: Besluit houders van dieren en eventuele chip- en registratieplicht voor katten.]</li>
        <li>Je biedt geen dieren aan die ziek zijn, illegaal zijn verkregen of niet van jou zijn.</li>
      </ul>

      <h2>4. Geen partij bij de verkoop</h2>
      <p>
        Nestje brengt verkopers en geïnteresseerden alleen met elkaar in contact. Afspraken over een kitten, zoals prijs,
        reservering, betaling, overdracht en garantie, maak je rechtstreeks met de andere partij. Wij zijn geen partij bij
        die afspraken en zijn niet aansprakelijk voor de nakoming ervan of voor de gezondheid of het gedrag van een dier.
      </p>

      <h2>5. Wat niet mag</h2>
      <p>
        Het is niet toegestaan Nestje te gebruiken voor andere dieren dan katten, voor misleidende of onrechtmatige inhoud,
        voor spam, of op een manier die de dienst of andere gebruikers schaadt. Wij mogen inhoud verwijderen of een account
        blokkeren als we redelijkerwijs vermoeden dat deze voorwaarden worden overtreden.
      </p>

      <h2>6. Beschikbaarheid</h2>
      <p>
        We doen ons best Nestje goed werkend te houden, maar garanderen niet dat de dienst altijd beschikbaar of foutloos is.
        We kunnen functies wijzigen, toevoegen of stoppen. Als we Nestje helemaal stoppen, laten we dat minstens [30] dagen
        van tevoren weten zodat je je gegevens kunt bewaren.
      </p>

      <h2>7. Aansprakelijkheid</h2>
      <p>
        Nestje is gratis. Voor zover de wet dat toestaat, zijn wij niet aansprakelijk voor schade die ontstaat door het gebruik
        van de dienst, tenzij er sprake is van opzet of bewuste roekeloosheid. [Juridisch laten toetsen.]
      </p>

      <h2>8. Opzeggen</h2>
      <p>
        Je kunt je nestje op elk moment verwijderen via Beheren → Account. Wil je ook je account laten verwijderen, mail dan naar{' '}
        <a href={`mailto:${CONFIG.contactEmail}`}>{CONFIG.contactEmail}</a>.
      </p>

      <h2>9. Links naar kattenverzorging.com</h2>
      <p>
        Nestjespagina's bevatten een link naar de starterslijst op kattenverzorging.com. Die pagina kan affiliate-links bevatten
        waarmee kattenverzorging.com een vergoeding ontvangt als je via die link iets koopt. [Controleren en afstemmen op de
        disclosure van kattenverzorging.com.]
      </p>

      <h2>10. Toepasselijk recht</h2>
      <p>Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in [arrondissement].</p>
      <Voet />
    </main>
  );
}
