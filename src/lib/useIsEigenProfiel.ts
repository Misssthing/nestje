'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

/**
 * True zodra de ingelogde gebruiker zelf de eigenaar is van het profiel met deze slug.
 * Zelfde RLS-truc: een niet-eigenaar krijgt gewoon geen rij terug uit `profielen`.
 */
export function useIsEigenProfiel(slug: string): boolean {
  const supabase = useMemo(() => createClient(), []);
  const [eigen, setEigen] = useState(false);

  useEffect(() => {
    let actief = true;
    (async () => {
      const { data: sessie } = await supabase.auth.getSession();
      if (!sessie.session) return;
      const { data } = await supabase.from('profielen').select('owner_id').eq('slug', slug).maybeSingle<{ owner_id: string }>();
      if (actief && data) setEigen(true);
    })();
    return () => {
      actief = false;
    };
  }, [supabase, slug]);

  return eigen;
}
