import type { Metadata } from 'next';
import Link from 'next/link';
import KopieerLink from '@/components/KopieerLink';
import Voet from '@/components/Voet';
import { CONFIG, metUtm } from '@/lib/config';
import { EERSTE_DAGEN, EERSTE_DAGEN_INTRO, EERSTE_DAGEN_PDF, EERSTE_DAGEN_TITEL } from '@/lib/eerste-dagen';

export const metadata: Metadata = {
  title: EERSTE_DAGEN_TITEL,
  description: 'Zo laat je een kitten rustig wennen in huis: de wenkamer, de eerste dag, andere huisdieren, eten, de kattenbak en de dierenarts.',
  alternates: { canonical: '/eerste-dagen' },
};

export default function EersteDagen() {
  return (
    <main className="wrap tekst eerste-dagen">
      <div className="bar">
        <Link href="/kittens" className="brand">Nestje</Link>
      </div>

      <h1>{EERSTE_DAGEN_TITEL}</h1>
      <p>{EERSTE_DAGEN_INTRO}</p>

      <div className="panel ed-delen">
        <p style={{ marginTop: 0 }}>
          <strong>Haal je een kitten op of verkoop je kittens?</strong> Deze uitleg is handig voor de nieuwe eigenaar. Stuur de link, of print de PDF. Achterin
          staat een lijstje om na te vragen bij de verkoper, zoals het voer, de korrel en de volgende enting.
        </p>
        <div className="actions">
          <a className="btn primary" href={EERSTE_DAGEN_PDF} download>Download als PDF</a>
          <KopieerLink url={`${CONFIG.siteUrl}/eerste-dagen`} />
        </div>
      </div>

      {EERSTE_DAGEN.map((s) => (
        <section key={s.kop}>
          <h2>{s.kop}</h2>
          {s.blokken.map((b, i) =>
            b.soort === 'p' ? (
              <p key={i}>{b.inhoud}</p>
            ) : b.soort === 'link' ? (
              <p key={i} className="ed-tip">
                {b.tekst}{' '}
                <a href={metUtm(b.href, 'eerste-dagen', 'tekst')} target="_blank" rel="noopener">{b.label} ↗</a>
              </p>
            ) : (
              <ul key={i}>
                {b.inhoud.map((t) => <li key={t}>{t}</li>)}
              </ul>
            ),
          )}
        </section>
      ))}

      <section className="klaar">
        <h2>Nog niet alles in huis?</h2>
        <p>Van kattenbak tot krabpaal: lees wat je nodig hebt voordat je kitten komt.</p>
        <a className="btn accent" href={metUtm(CONFIG.starterslijstUrl, 'eerste-dagen')} target="_blank" rel="noopener">
          Wat heb je nodig voor een kitten? ↗
        </a>
      </section>

      <Voet />
    </main>
  );
}
