import Link from 'next/link';

export default function NietGevonden() {
  return (
    <main className="wrap tekst">
      <div className="bar">
        <Link href="/" className="brand">Nestje</Link>
      </div>
      <h1>Dit nestje bestaat niet (meer)</h1>
      <p>Controleer de link, of vraag de verkoper om de link opnieuw te sturen.</p>
    </main>
  );
}
