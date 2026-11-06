'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

/**
 * Alleen zichtbaar voor de verkoper zelf: een snelle weg naar het beheer van dit nestje.
 * De database geeft het nestje alleen terug aan de eigenaar, dus kopers zien dit nooit.
 */
export default function EigenaarBalk({ slug }: { slug: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [nestId, setNestId] = useState<string | null>(null);

  useEffect(() => {
    let actief = true;
    (async () => {
      const { data: sessie } = await supabase.auth.getSession();
      if (!sessie.session) return;
      const { data } = await supabase.from('nests').select('id').eq('slug', slug).maybeSingle<{ id: string }>();
      if (actief && data) setNestId(data.id);
    })();
    return () => {
      actief = false;
    };
  }, [supabase, slug]);

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
