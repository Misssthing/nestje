import Link from 'next/link';
import Voet from '@/components/Voet';

export default function Start() {
  return (
    <main className="wrap start breed">
      <div className="bar">
        <span className="brand">Nestje</span>
        <Link href="/login" className="btn ghost klein">Inloggen</Link>
      </div>
      <h1>Een goede match voor je kitten</h1>
      <p className="lead">
        Eén link met foto's, wie nog vrij is en wanneer ze mogen verhuizen. Raskatten met stamboom, pas verhuizen na 12 weken,
        gechipt — en de mogelijkheid voor kopers om eerst iets over zichzelf te vertellen. Zo vindt elke kitten zijn juiste toekomstige personeel.
      </p>
      <Link href="/login" className="btn primary">Maak je nestjespagina</Link>
      <div className="voorbeeld" aria-hidden="true">
        <div className="big">7</div>
        <div className="txt">weken tot ze mogen verhuizen</div>
      </div>
      <p className="lead" style={{ marginTop: 18 }}>
        Gratis, zonder wachtwoord en zonder app. Voor iedereen met af en toe een nestje.
      </p>
      <Voet />
    </main>
  );
}
