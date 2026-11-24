'use client';

import Link from 'next/link';
import { useIsEigenProfiel } from '@/lib/useIsEigenProfiel';

/**
 * Klein potlood-icoontje, alleen zichtbaar voor de ingelogde eigenaar van dit profiel.
 * Linkt naar het profielblokje in Beheer (zelfde plek als de Checklist's "profiel"-stap).
 */
export default function ProfielBewerkIcoon({ slug }: { slug: string }) {
  const eigen = useIsEigenProfiel(slug);

  if (!eigen) return null;
  return (
    <Link href="/beheer#profiel" className="bewerkicoon" aria-label="Profiel aanpassen" title="Profiel aanpassen">
      ✎
    </Link>
  );
}
