import Link from 'next/link';
import LoginForm from '@/app/login/LoginForm';

/**
 * Startpagina voor verkopers: aanmelden of inloggen, plus uitleg over hoe Nestje werkt.
 * Staat op /login (inloggen) en /verkopen (uitleg voor nieuwe verkopers).
 */
export default function VerkoperStart({ ingelogd = false, fout = false }: { ingelogd?: boolean; fout?: boolean }) {
  return (
    <main className="wrap breed">
      <div className="bar">
        <Link href="/kittens" className="brand">Nestje</Link>
        <a className="btn ghost klein" href="/hulp">Hulp</a>
      </div>

      <div className="start-grid">
        <section className="start-form" aria-labelledby="start-kop">
          <h1 id="start-kop">Maak gratis je nestjespagina</h1>
          <p className="start-intro">
            Eén mooie pagina voor al je kittens, die je deelt via WhatsApp en Facebook. Kopers zien meteen welke kittens nog
            vrij zijn en wanneer ze mogen verhuizen.
          </p>
          {ingelogd ? (
            <div className="panel">
              <p style={{ marginTop: 0 }}>Je bent al ingelogd.</p>
              <Link className="btn primary" href="/beheer">Naar je nestjes</Link>
            </div>
          ) : (
            <>
              <p className="start-sub">
                <strong>Nieuw of al een account?</strong> Vul je e-mailadres in. Je krijgt een mail met een inloglink, geen
                wachtwoord nodig.
              </p>
              {fout && <p className="fout">De inloglink is verlopen of al gebruikt. Vraag hieronder een nieuwe aan.</p>}
              <LoginForm />
            </>
          )}
          <p className="hint">
            Liever hulp? Mail je foto&apos;s, de naam van de moeder en de geboortedatum naar{' '}
            <strong>nestje@kattenverzorging.com</strong>, dan zetten wij je pagina klaar.
          </p>
        </section>

        <div className="start-uitleg">
          <section aria-labelledby="zo-werkt-het">
            <h2 id="zo-werkt-het">Zo werkt het</h2>
            <ol className="start-stappen">
              <li>
                <strong>Inloggen met je e-mail</strong>
                <span>Geen wachtwoord: je krijgt een inloglink. Nieuw? Dan maken we meteen je account.</span>
              </li>
              <li>
                <strong>Nestje aanmaken</strong>
                <span>Naam van de moeder, geboortedatum en aantal kittens. Je pagina staat binnen een minuut.</span>
              </li>
              <li>
                <strong>Foto&apos;s en gegevens aanvullen</strong>
                <span>Een checklist laat zien wat er nog mist, zoals de foto van de moeder en je WhatsApp-nummer.</span>
              </li>
              <li>
                <strong>Delen, en eventueel in het overzicht</strong>
                <span>
                  Je link werkt meteen. Wil je ook gevonden worden op Nestje? Dan bekijken we je nestje eerst, meestal binnen 24 uur.
                </span>
              </li>
              <li>
                <strong>Kopers melden zich</strong>
                <span>Via WhatsApp of de wachtlijst. Jij kiest wie een kitten krijgt en zet de status met één tik.</span>
              </li>
            </ol>
          </section>

          <section className="panel" aria-labelledby="nodig">
            <h2 id="nodig">Wat heb je nodig?</h2>
            <ul className="start-nodig">
              <li>Een foto van de moeder, het liefst met haar kittens</li>
              <li>De geboortedatum, of de uitgerekende datum</li>
              <li>Foto&apos;s van de kittens (je kunt ze later toevoegen)</li>
              <li>Je WhatsApp-nummer (staat nooit als tekst op je pagina)</li>
              <li>Bij een raskat: de stamboomgegevens van beide ouders</li>
            </ul>
          </section>

          <section aria-labelledby="regels">
            <h2 id="regels">Onze huisregels in het kort</h2>
            <p>
              Kittens verhuizen op zijn vroegst na 12 weken, gechipt en ingeënt. Op je pagina staat de echte moeder. Een rasnaam
              gebruik je alleen met stamboom, en we zijn er niet voor broodfok.{' '}
              <Link href="/huisregels">Lees alle huisregels</Link>.
            </p>
          </section>

          <section aria-labelledby="vragen">
            <h2 id="vragen">Veelgestelde vragen</h2>
            <dl className="start-faq">
              <dt>Wat kost het?</dt>
              <dd>Niets. Nestje is gratis.</dd>
              <dt>Ziet iedereen mijn telefoonnummer?</dt>
              <dd>Nee. Kopers tikken op een knop en WhatsApp opent; je nummer staat nergens als tekst.</dd>
              <dt>Moet mijn kat een stamboom hebben?</dt>
              <dd>Nee. Ook huiskatten en kruisingen zijn welkom. Een rasnaam zoals Maine Coon gebruik je alleen met stamboom.</dd>
            </dl>
            <p className="hint">
              <Link href="/kittens">Bekijk nestjes van anderen in het overzicht</Link> · <a href="/hulp">Alle hulp</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
