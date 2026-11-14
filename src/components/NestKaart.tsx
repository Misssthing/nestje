'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

export type NestKaartData = {
  slug: string;
  titel: string;
  /** Kleine groene regel boven de titel, zoals "4 vrij · nog 6 wk" */
  label: string;
  /** Kleur van het label: vrij (groen), optie (oranje) of rustig (grijs) */
  labelSoort: 'vrij' | 'optie' | 'rustig';
  regels: string[];
  prijs: string | null;
  verkoper: string | null;
  vondeling: boolean;
  stamboom: boolean;
  fotos: string[];
};

/**
 * Nestje als fotokaart. Door de foto's swipe je (telefoon) of klik je met de pijltjes (computer).
 * Tikken op een foto of de tekst opent het nestje.
 */
export default function NestKaart({ n, klein = false }: { n: NestKaartData; klein?: boolean }) {
  const strook = useRef<HTMLDivElement>(null);
  const [actief, setActief] = useState(0);
  const href = `/n/${n.slug}`;
  const fotos = n.fotos.length ? n.fotos : [];

  function naar(i: number) {
    const el = strook.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }

  return (
    <article className={`nkaart${klein ? ' klein' : ''}`}>
      <div className="nkaart-media">
        {fotos.length ? (
          <div
            ref={strook}
            className="nkaart-strook"
            onScroll={(e) => {
              const el = e.currentTarget;
              setActief(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
            }}
          >
            {fotos.map((f, i) => (
              <Link key={f} href={href} className="nkaart-slide" tabIndex={i === 0 ? 0 : -1} aria-label={i === 0 ? n.titel : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f} alt={i === 0 ? n.titel : ''} loading="lazy" draggable={false} />
              </Link>
            ))}
          </div>
        ) : (
          <Link href={href} className="nkaart-slide leeg" aria-label={n.titel} />
        )}

        {fotos.length > 1 && (
          <>
            <button
              type="button"
              className="nkaart-pijl links"
              aria-label="Vorige foto"
              hidden={actief === 0}
              onClick={() => naar(actief - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="nkaart-pijl rechts"
              aria-label="Volgende foto"
              hidden={actief >= fotos.length - 1}
              onClick={() => naar(actief + 1)}
            >
              ›
            </button>
            <div className="nkaart-stippen" aria-hidden="true">
              {fotos.map((f, i) => (
                <span key={f} className={i === actief ? 'aan' : ''} />
              ))}
            </div>
          </>
        )}
        {n.vondeling && <span className="nkaart-badge">Vondelingen</span>}
        {n.stamboom && (
          <span className="nkaart-badge stamboom">
            <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Stamboom
          </span>
        )}
      </div>

      <Link href={href} className="nkaart-tekst">
        <span className={`nkaart-label ${n.labelSoort}`}>{n.label}</span>
        <strong className="nkaart-titel">{n.titel}</strong>
        {n.regels.filter(Boolean).map((r) => (
          <span key={r} className="nkaart-regel">{r}</span>
        ))}
        {(n.verkoper || n.prijs) && (
          <span className="nkaart-voet">
            {n.verkoper && <span className="nkaart-verkoper">{n.verkoper}</span>}
            {n.prijs && <span className="nkaart-prijs">{n.prijs}</span>}
          </span>
        )}
      </Link>
    </article>
  );
}
