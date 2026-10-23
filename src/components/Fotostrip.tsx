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

export default function Fotostrip({ fotos, naam }: { fotos: string[]; naam: string }) {
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
        {fotos.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={i === 0 ? `Foto van ${naam}` : `Foto ${i + 1} van ${naam}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        ))}
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
