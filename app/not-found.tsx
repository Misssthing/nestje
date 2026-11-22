import Link from 'next/link';

export default function NietGevonden() {
  return (
    <main className="wrap tekst">
      <div className="bar"><Link href="/" className="brand">Nestje</Link></div>
      <h1>Deze pagina bestaat niet</h1>
      <p><Link href="/">Naar de startpagina</Link></p>
    </main>
  );
}
