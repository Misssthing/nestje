import Link from 'next/link';
import Voet from '@/components/Voet';

export default function Start() {
  return (
    <main className="wrap start">
      <div className="bar">
        <span className="brand">Nestje</span>
        <Link href="/login" className="btn ghost klein">Inloggen</Link>
      </div>
      <h1>Eén link voor je hele nestje</h1>
      <p className="lead">
        Foto's, wie nog vrij is en wanneer ze mogen verhuizen. Kopers stellen hun vraag met één tik via WhatsApp. Jij regelt alles vanaf je telefoon.
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
