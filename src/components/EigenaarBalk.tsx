'use client';

import Link from 'next/link';
import { useEigenNestId } from '@/lib/useEigenNestId';

/**
 * Alleen zichtbaar voor de verkoper zelf: een snelle weg naar het beheer van dit nestje.
 * De database geeft het nestje alleen terug aan de eigenaar, dus kopers zien dit nooit.
 */
export default function EigenaarBalk({ slug }: { slug: string }) {
  const nestId = useEigenNestId(slug);

  if (!nestId) return null;
  return (
    <div className="eigenaarbalk" role="region" aria-label="Je eigen nestje">
      <span>Dit is jouw nestje</span>
      <Link href={`/beheer/${nestId}`} className="btn primary klein">
        ✎ Aanpassen
      </Link>
    </div>
  );
}
