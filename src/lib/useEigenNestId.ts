'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

/**
 * Geeft het nest-id terug zodra de ingelogde gebruiker zelf de eigenaar is van het nestje
 * met deze slug (anders null). Gebruikt dezelfde RLS-truc als EigenaarBalk: een niet-eigenaar
 * krijgt gewoon geen rij terug.
 */
export function useEigenNestId(slug: string): string | null {
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

  return nestId;
}
