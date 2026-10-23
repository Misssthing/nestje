'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

/**
 * Landingspagina van de inloglink. Supabase zet de sessie in het #-deel van het adres;
 * deze pagina slaat die op als cookie en stuurt door naar het beheer.
 * Werkt in elke browser, ook als die niet dezelfde is als waarin de mail is aangevraagd.
 */
export default function InloggenAfronden() {
  const [fout, setFout] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    // Token direct uit de adresbalk en geschiedenis halen
    window.history.replaceState(null, '', window.location.pathname);

    if (!access_token || !refresh_token) {
      setFout(true);
      return;
    }

    createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) setFout(true);
        else window.location.replace('/beheer');
      });
  }, []);

  return (
    <main className="wrap tekst">
      <div className="bar">
        <span className="brand">Nestje</span>
      </div>
      {fout ? (
        <>
          <h1>Inloggen lukte niet</h1>
          <p>De inloglink is verlopen of al gebruikt. Vraag een nieuwe aan.</p>
          <p>
            <a className="btn primary" style={{ width: 'auto' }} href="/login">
              Naar inloggen
            </a>
          </p>
        </>
      ) : (
        <h1>Bezig met inloggen…</h1>
      )}
    </main>
  );
}
