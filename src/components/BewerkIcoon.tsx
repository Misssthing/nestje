'use client';

import Link from 'next/link';
import { useEigenNestId } from '@/lib/useEigenNestId';

type Props = {
  slug: string;
  /** Het anchor-id in Beheer waar deze knop naartoe moet springen, bv. "sectie-kittens". */
  anchor: string;
  label: string;
  className?: string;
};

/**
 * Klein potlood-icoontje, alleen zichtbaar voor de ingelogde eigenaar van dit nestje.
 * Linkt rechtstreeks naar de juiste plek in Beheer (zelfde sectie-ids als de Checklist gebruikt).
 */
export default function BewerkIcoon({ slug, anchor, label, className }: Props) {
  const nestId = useEigenNestId(slug);

  if (!nestId) return null;
  return (
    <Link
      href={`/beheer/${nestId}#${anchor}`}
      className={`bewerkicoon${className ? ` ${className}` : ''}`}
      aria-label={label}
      title={label}
    >
      ✎
    </Link>
  );
}
