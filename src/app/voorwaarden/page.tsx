import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';
import { CONFIG } from '@/lib/config';

export const metadata: Metadata = { title: 'Gebruiksvoorwaarden' };

const { bedrijf } = CONFIG;

export default function Voorwaarden() {
  return (
    <main className="wrap tekst">
      <div className="bar"><Link href="/" className="brand">Nestje</Link></div>
      <h1>Gebruiksvoorwaarden</h1>
      <p className="hint">Laatst bijgewerkt: {CONFIG.juridischBijgewerkt}</p>

      <h2>1. Over Nestje</h2>
      <p>
        Nestje is een online hulpmiddel van {bedrijf.naam}, gevestigd in {bedrijf.plaats}, KvK-nummer {bedrijf.kvk},
        btw-identificatienummer {bedrijf.btw}. Met Nestje maak je een deelbare pagina voor een nestje kittens. Door een account
        aan te maken ga je akkoord met deze voorwaarden. Contact: <a href={`mailto:${CONFIG.contactEmail}`}>{CONFIG.contactEmail}</a>.
      </p>

      <h2>2. Voor wie</h2>
      <p>Nestje is bedoeld voor particulieren met een nestje kittens en voor fokkers. Je moet 18 jaar of ouder zijn.</p>

      <h2>3. Jouw verantwoordelijkheid</h2>
      <ul>
        <li>Je bent zelf verantwoordelijk voor alles wat je op je pagina zet, en voor de juistheid daarvan. Dat geldt ook voor gezondheidsgegevens, stamboom en testuitslagen.</li>
        <li>Je zet alleen foto’s en teksten online waarvoor je de rechten hebt.</li>
        <li>Je houdt je aan de wet- en regelgeving rond het houden, fokken en verkopen of herplaatsen van dieren, waaronder de regels over de minimale leeftijd waarop kittens bij hun moeder weg mogen en over identificatie en registratie.</li>
        <li>Je biedt geen dieren aan die ziek zijn, illegaal zijn verkregen of niet van jou zijn.</li>
        <li>Je houdt je aan de <Link href="/huisregels">huisregels van Nestje</Link>. Die maken deel uit van deze voorwaarden.</li>
      </ul>

      <h2>4. Geen partij bij de verkoop</h2>
      <p>
        Nestje brengt verkopers en geïnteresseerden alleen met elkaar in contact. Afspraken over een kitten, zoals prijs,
        reservering, betaling, overdracht en garantie, maak je rechtstreeks met de andere partij. Wij zijn geen partij bij die
        afspraken, controleren de gegevens op nestjespagina’s niet en zijn niet aansprakelijk voor de nakoming van afspraken of
        voor de gezondheid of het gedrag van een dier.
      </p>

      <h2>5. Wat niet mag</h2>
      <p>
        Het is niet toegestaan Nestje te gebruiken voor andere dieren dan katten, voor misleidende of onrechtmatige inhoud, in strijd met de huisregels, voor
        spam, of op een manier die de dienst of andere gebruikers schaadt. Wij mogen inhoud verwijderen of een account blokkeren
        als we redelijkerwijs vermoeden dat deze voorwaarden worden overtreden.
      </p>

      <h2>6. Kosten</h2>
      <p>
        Nestje is op dit moment gratis te gebruiken. Voeren we in de toekomst betaalde functies in, dan laten we dat vooraf weten
        en kies je zelf of je die gebruikt.
      </p>

      <h2>7. Beschikbaarheid</h2>
      <p>
        We doen ons best Nestje goed werkend te houden, maar garanderen niet dat de dienst altijd beschikbaar of foutloos is. We
        kunnen functies wijzigen, toevoegen of stoppen. Als we Nestje helemaal stoppen, laten we dat minstens 30 dagen van tevoren
        weten, zodat je je gegevens kunt bewaren.
      </p>

      <h2>8. Aansprakelijkheid</h2>
      <p>
        Voor zover de wet dat toestaat, zijn wij niet aansprakelijk voor schade die ontstaat door het gebruik van Nestje, tenzij
        er sprake is van opzet of bewuste roekeloosheid aan onze kant.
      </p>

      <h2>9. Opzeggen</h2>
      <p>
        Je kunt je nestje op elk moment verwijderen via je beheer, onder “Account”. Wil je ook je account laten verwijderen, mail
        dan naar <a href={`mailto:${CONFIG.contactEmail}`}>{CONFIG.contactEmail}</a>.
      </p>

      <h2>10. Links naar kattenverzorging.com</h2>
      <p>
        Nestjespagina’s bevatten een link naar de pagina over wat je nodig hebt voor een kitten op kattenverzorging.com. Die
        pagina kan affiliate-links bevatten: koop je via zo’n link iets, dan ontvangt {bedrijf.naam} daarvoor een vergoeding van de
        winkel. Je betaalt daardoor niet meer.
      </p>

      <h2>11. Toepasselijk recht</h2>
      <p>Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de rechtbank Rotterdam.</p>
      <Voet />
    </main>
  );
}
