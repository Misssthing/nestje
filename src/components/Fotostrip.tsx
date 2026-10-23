'use client';

import { useRef, useState } from 'react';

const Poot = () => (
  <svg viewBox="0 0 64 64" aria-hidden="true" fill="currentColor">
    <ellipse cx="32" cy="41" rx="11" ry="9" />
    <circle cx="19" cy="28" r="5" />
    <circle cx="27" cy="20" r="5" />
    <circle cx="37" cy="20" r="5" />
    <circle cx="45" cy="28" r="5" />
  </svg>
);

/** vul: toon de hele foto, met een vervaagde versie van dezelfde foto als achtergrond (voor nestfoto's) */
export default function Fotostrip({ fotos, naam, vul = false }: { fotos: string[]; naam: string; vul?: boolean }) {
  const [actief, setActief] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  if (!fotos.length) {
    return (
      <div className="leeg">
        <Poot />
      </div>
    );
  }

  return (
    <>
      <div
        className="strip"
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActief(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {fotos.map((src, i) => {
          const alt = i === 0 ? `Foto van ${naam}` : `Foto ${i + 1} van ${naam}`;
          const laden = i === 0 ? 'eager' : 'lazy';
          return vul ? (
            <div key={src} className="slide">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="achter" src={src} alt="" aria-hidden="true" loading={laden} decoding="async" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="voor" src={src} alt={alt} loading={laden} decoding="async" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={alt} loading={laden} decoding="async" />
          );
        })}
      </div>
      {fotos.length > 1 && (
        <div className="stippen" aria-hidden="true">
          {fotos.map((src, i) => (
            <i key={src} className={i === actief ? 'aan' : ''} />
          ))}
        </div>
      )}
    </>
  );
}
