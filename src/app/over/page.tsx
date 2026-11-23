import type { Metadata } from 'next';
import Link from 'next/link';
import Voet from '@/components/Voet';
import { CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Over Nestje',
  description:
    'Waarom Nestje bestaat, wie erachter zit, en antwoord op de vragen die kopers en verkopers ons het vaakst stellen.',
};

const VRAGEN: { v: string; a: React.ReactNode }[] = [
  {
    v: 'Is Nestje hetzelfde als andere sites, zoals nestjes.nl?',
    a: (
      <p>
        Nee. Nestje is een eigen, onafhankelijk platform, los van andere kittensites. Waar een marktplaats je kitten
        tussen honderden advertenties zet, krijg je bij Nestje één eigen, deelbare pagina per nestje. Twijfel je of je
        op de juiste site zit? Check dan of de link begint met <strong>nestje.kattenverzorging.com</strong>.
      </p>
    ),
  },
  {
    v: 'Moet ik fokker zijn om op Nestje te staan?',
    a: (
      <p>
        Nee. Alle nestjes zijn welkom, zolang het verantwoord gebeurt: een fokker met stamboom, maar ook iemand die een
        keer een nestje heeft van de eigen poes. Een rasnaam gebruik je dan alleen als er ook echt een stamboom bij
        hoort — zie de <Link href="/huisregels">huisregels</Link>.
      </p>
    ),
  },
  {
    v: 'Waarom moet ik soms 13 weken wachten voor ik mijn kitten kan ophalen?',
    a: (
      <>
        <p>
          Tussen 8 en 12 weken leert een kitten bij zijn moeder en nestgenootjes spelen zonder te bijten en omgaan met
          andere katten. Kittens die te vroeg weggaan, hebben vaker last van angst of gedragsproblemen. Daarom hanteren
          we op Nestje 12 weken als absolute ondergrens, en gebruiken veel verkopers 13 weken of meer.
        </p>
        <p>
          Dat voelt soms lang, zeker als je er al naar uitkijkt. Maar een verkoper die zich hieraan houdt, doet dat voor
          een gezonde, sociale kitten — en dat is precies wat je wilt. Lees meer in de <Link href="/huisregels">huisregels</Link>.
        </p>
      </>
    ),
  },
  {
    v: 'Hoe weet ik dat ik met een betrouwbare verkoper te maken heb?',
    a: (
      <p>
        Elk nestje op Nestje volgt dezelfde <Link href="/huisregels">huisregels</Link>: een rasnaam mag alleen met een
        echte stamboom, de moeder staat op de pagina, en kittens verhuizen pas als ze er klaar voor zijn. Heeft een
        cattery meerdere nestjes, dan vind je 'm ook terug in het <Link href="/catteries">overzicht van catteries</Link>.
        Twijfel je toch, vraag dan gerust naar de stamboompapieren en kom eerst kijken bij de kittens en hun moeder.
      </p>
    ),
  },
  {
    v: 'Wat als er later iets mis blijkt met mijn kitten?',
    a: (
      <p>
        Dan weet je precies waar je moet zijn: bij dezelfde verkoper die je de kitten heeft verkocht. Diens
        nestjespagina (en, bij een cattery, de profielpagina) blijft gewoon bestaan, dus je kunt altijd terugvinden met
        wie je te maken had. Geen kat in de zak.
      </p>
    ),
  },
  {
    v: 'Hoe controleert Nestje een nestje voordat het in het overzicht staat?',
    a: (
      <p>
        We bekijken elk nieuw nestje met de hand voordat het in het <Link href="/kittens">overzicht</Link> verschijnt,
        en checken onder andere of de huisregels zijn gevolgd. Geeft een verkoper stamboomnummers van beide ouders op,
        dan controleren we die ook op het juiste format en op dubbel gebruik bij andere verkopers — dat zie je terug
        als het label "Nummers gecontroleerd".
      </p>
    ),
  },
  {
    v: 'Ik heb als fokker geen eigen website. Kan ik toch één vaste link delen?',
    a: (
      <p>
        Ja. Zet in je overzicht de profielpagina aan en je krijgt één vaste link met al je lopende nestjes, je
        catterynaam en een korte intro — bijvoorbeeld voor je Facebook-bio. Afgeronde nestjes verdwijnen er vanzelf
        weer van af.
      </p>
    ),
  },
  {
    v: 'Wat kost Nestje?',
    a: <p>Nestje is op dit moment gratis te gebruiken, als hulpmiddel van kattenverzorging.com.</p>,
  },
];

export default function Over() {
  return (
    <main className="wrap tekst">
      <div className="bar">
        <Link href="/kittens" className="brand">Nestje</Link>
      </div>

      <h1>Over Nestje</h1>

      <img
        src="/lisette-over-nestje.jpg"
        alt="Lisette, van Nestje"
        width={700}
        height={932}
        style={{ width: '100%', maxWidth: 260, borderRadius: 16, display: 'block', margin: '4px 0 24px' }}
      />

      <p>Ik ben Lisette, en Nestje is ontstaan uit ergernis.</p>
      <p>
        Op Marktplaats en social media zie je het dagelijks: kittens die als "raskat" worden aangeboden, terwijl het
        eigenlijk gewoon een kruising is. Geen stamboom, geen papieren, en vaak verhuizen ze veel te vroeg bij hun
        moeder weg. Als koper weet je dan niet eens met wie je te maken hebt — een serieuze fokker, of iemand die er
        snel geld mee wil verdienen.
      </p>
      <p>
        Dat wilde ik anders. Nestje is geen plek om zo snel mogelijk een kitten te verkopen. Het is een plek om op een
        eerlijke, verantwoorde manier een kitten een nieuw thuis te geven — en voor kopers om een kitten te{' '}
        <em>kiezen</em>, niet zomaar te kopen.
      </p>
      <p>
        Daarom gelden er op Nestje gewoon regels: een rasnaam mag alleen met een echte stamboom, kittens verhuizen pas
        als ze er klaar voor zijn (meestal 13 weken, en ja, dat is bewust langer dan je misschien gewend bent), en je
        kunt als koper altijd zien bij welke verkoper je terechtkomt. Geen kat in de zak. Loop je later toch ergens
        tegenaan, dan weet je ook precies waar je moet zijn: bij dezelfde verkoper die je de kitten heeft verkocht.
      </p>
      <p>
        Dat betekent niet dat je fokker met stamboom moet zijn om welkom te zijn. Alle nestjes zijn welkom — een
        cattery die het serieus aanpakt, maar net zo goed iemand die één keer een nestje heeft van de eigen poes.
        Zolang het verantwoord gebeurt en je eerlijk bent over wat je kittens wel en niet zijn, heb je hier een plek.
      </p>
      <p>
        Ik wil dat Nestje de juiste verkopers trekt — die het goed willen doen — en de juiste kopers, die begrijpen dat
        verantwoord fokken en verhuizen nu eenmaal tijd kost. Niet flitsend, niet snel, maar betrouwbaar. Vanuit liefde
        voor de kat, en voor elke kitten die hier een plekje krijgt.
      </p>
      <p>
        Zelf ben ik vooral een techneut, geen fokker. Alles wat ik weet over gezonde nestjes, goede huisregels en wat
        er in de praktijk wel en niet werkt, heb ik geleerd van de fokkers die Nestje gebruiken, meedenken en
        meetesten. Deze plek is net zo goed van hen als van mij.
      </p>
      <p>
        Heb je als fokker of cattery geen eigen website? Dan hoeft dat geen probleem te zijn. Binnen Nestje kun je een
        gratis profielpagina aanzetten met al je lopende nestjes, je catterynaam en een korte intro over jezelf — één
        vaste link die je overal kunt delen, bijvoorbeeld in je Facebook-bio.
      </p>
      <p>— Lisette</p>

      <h2 style={{ marginTop: 36 }}>Veelgestelde vragen</h2>
      <div className="lijst" style={{ marginTop: 16 }}>
        {VRAGEN.map(({ v, a }) => (
          <details key={v} className="panel" style={{ margin: 0 }}>
            <summary style={{ fontSize: 18 }}>{v}</summary>
            <div className="hulp-antwoord">{a}</div>
          </details>
        ))}
      </div>

      <section className="klaar">
        <h2>Nog een vraag?</h2>
        <p>Staat je vraag er niet bij? Bekijk de <Link href="/hulp">hulp</Link>-pagina, of mail ons.</p>
        <a className="btn accent" href={`mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent('Vraag over Nestje')}`}>
          Mail {CONFIG.contactEmail}
        </a>
      </section>

      <Voet />
    </main>
  );
}
