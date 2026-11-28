import type { Metadata } from 'next';
import Link from 'next/link';
import LeesOok from '@/components/LeesOok';
import Voet from '@/components/Voet';

export const metadata: Metadata = {
  title: 'Kitten niet voor de fok? Dit betekent het',
  description:
    'Zie je bij een kitten "niet voor de fok" staan, of hoor je dat hij gecastreerd of gesteriliseerd moet verhuizen? Dat is geen vreemde eis, maar een teken van een verantwoorde verkoper. Uitgelegd.',
  alternates: { canonical: '/niet-voor-de-fok' },
};

export default function NietVoorDeFok() {
  return (
    <main className="wrap tekst">
      <div className="bar">
        <Link href="/kittens" className="brand">Nestje</Link>
      </div>
      <nav className="kruimel" aria-label="Kruimelpad">
        <Link href="/kenniscentrum">Kenniscentrum</Link> <span aria-hidden="true">›</span> <span>Niet voor de fok</span>
      </nav>

      <h1>Kitten niet voor de fok? Dit betekent het</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="artikel-hero" src="/kenniscentrum/niet-voor-de-fok.jpg" alt="" />
      <p className="lead">
        Zie je bij een kitten de tekst &ldquo;niet voor de fok&rdquo; staan, of hoor je van een verkoper dat je kitten
        gecastreerd of gesteriliseerd moet verhuizen? Dat is geen vreemde eis, maar juist een teken van een verantwoorde
        verkoper.
      </p>

      <h2>Stamboom en &ldquo;niet voor de fok&rdquo; zijn twee verschillende dingen</h2>
      <p>
        Een stamboom bewijst de afstamming van een kitten. &ldquo;Niet voor de fok&rdquo; gaat over iets anders: of er met
        déze kat verder gefokt mag worden. Die twee hoeven niets met elkaar te maken te hebben:
      </p>
      <ul>
        <li>
          <strong>Met stamboom, niet voor de fok</strong> — komt vaak voor. Fokkers verkopen regelmatig kittens van
          &ldquo;huisdierkwaliteit&rdquo;: volledig raszuiver en met een echte stamboom, maar net niet geschikt bevonden
          voor verdere fok of de showring. Die kittens krijgen gewoon hun papieren, met de afspraak dat ze niet gefokt
          worden.
        </li>
        <li>
          <strong>Zonder stamboom, niet voor de fok</strong> — bijvoorbeeld bij een kruising, een huiskat, of een
          onverwacht nestje. Hier is vaak niet eens genoeg bekend over de afstamming om verantwoord mee te kunnen fokken.
        </li>
      </ul>

      <h2>Waarom doen verkopers dit?</h2>
      <ul>
        <li>
          <strong>Om ongecontroleerd fokken te voorkomen.</strong> Niet elk kitten is geschikt om mee te fokken —
          bijvoorbeeld omdat één van de ouders een aandoening draagt die je niet wilt doorgeven, of omdat de afstamming niet
          volledig bekend is.
        </li>
        <li>
          <strong>Om het ras te beschermen.</strong> Zo voorkom je dat er kittens met een rasnaam op de markt komen zonder
          dat er écht verantwoord mee is gefokt.
        </li>
        <li>
          <strong>Uit dierenwelzijn.</strong> Minder ongeplande nestjes betekent minder kittens die bij toeval ter wereld
          komen, zonder dat er een plek voor ze geregeld is.
        </li>
      </ul>

      <h2>Wat betekent het voor jou als koper?</h2>
      <p>
        Niets geks: je krijgt gewoon een gezond, vrolijk kitten — met of zonder stamboom — en de afspraak dat je er niet
        mee fokt. Kom je deze eis tegen bij een verkoper, zie het dan als een goed teken: deze verkoper denkt verder dan de
        verkoop zelf.
      </p>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Zo laat Nestje het zien</h2>
        <p style={{ marginBottom: 0 }}>
          Bij een nestje op Nestje zie je in het vertrouwensblokje of dit van toepassing is, los van of het nestje een
          stamboom heeft.
        </p>
      </div>

      <section className="klaar">
        <h2>Op zoek naar een kitten?</h2>
        <p>Bekijk alle nestjes die nu op Nestje staan.</p>
        <Link className="btn accent" href="/kittens">Bekijk kittens →</Link>
      </section>

      <LeesOok huidige="/niet-voor-de-fok" />

      <Voet />
    </main>
  );
}
