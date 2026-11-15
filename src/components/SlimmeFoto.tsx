'use client';

/**
 * Toont een duimnagel-foto (klein, dus snel) met automatische terugval op de grote foto als de
 * duimnagel (nog) niet bestaat — bijvoorbeeld bij foto's die zijn geüpload vóórdat duimnagels
 * werden gegenereerd. Geeft `src` door als duimnagel-URL (zie fotoThumbUrl in lib/config.ts).
 */
export default function SlimmeFoto({
  src,
  alt,
  className,
  loading = 'lazy',
  draggable,
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  draggable?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      draggable={draggable}
      onError={(e) => {
        const img = e.currentTarget;
        const volledig = img.src.replace(/-klein(\.[a-zA-Z0-9]+)(\?.*)?$/, '$1$2');
        if (volledig !== img.src) img.src = volledig;
      }}
    />
  );
}
