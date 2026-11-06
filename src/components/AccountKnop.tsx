'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

/**
 * Inloggen of "Mijn nestjes", afhankelijk van of de bezoeker al is ingelogd.
 * Draait in de browser, zodat de sessie netjes wordt ververst.
 */
export default function AccountKnop({ metNieuw = false }: { metNieuw?: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [ingelogd, setIngelogd] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIngelogd(Boolean(data.session)));
  }, [supabase]);

  if (ingelogd) {
    return (
      <Link href="/beheer" className="btn ghost klein">
        Mijn nestjes
      </Link>
    );
  }
  return (
    <span className="accountknoppen">
      <Link href="/login" className="inloglink">
        Inloggen
      </Link>
      {metNieuw && (
        <Link href="/login" className="btn ghost klein">
          Zelf een nestje?
        </Link>
      )}
    </span>
  );
}
