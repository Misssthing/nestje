'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stap, setStap] = useState<'email' | 'code'>('email');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  async function stuurLink(e: React.FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFout('');
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/confirm?next=/beheer` },
    });
    setBezig(false);
    if (error) {
      setFout(
        error.status === 429
          ? 'Er zijn net te veel inlogmails verstuurd. Probeer het over een paar minuten opnieuw.'
          : 'Versturen lukte niet. Controleer je e-mailadres.',
      );
      return;
    }
    setStap('code');
  }

  async function controleerCode(e: React.FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFout('');
    const { error } = await createClient().auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    setBezig(false);
    if (error) {
      setFout('Deze code klopt niet of is verlopen.');
      return;
    }
    router.replace('/beheer');
    router.refresh();
  }

  if (stap === 'code') {
    return (
      <form onSubmit={controleerCode} className="panel">
        <p style={{ marginTop: 0 }}>
          Mail verstuurd naar <strong>{email}</strong>. Open de link in de mail in dezelfde browser, of vul hier de code uit de mail in als die erin staat.
        </p>
        <label className="veld">
          <span>Code uit de mail</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,10}"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
          />
        </label>
        {fout && <p className="fout">{fout}</p>}
        <div className="actions">
          <button className="btn primary" disabled={bezig}>
            {bezig ? 'Bezig…' : 'Inloggen'}
          </button>
          <button type="button" className="btn ghost" onClick={() => setStap('email')}>
            Ander e-mailadres
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={stuurLink} className="panel">
      <label className="veld">
        <span>E-mailadres</span>
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      {fout && <p className="fout">{fout}</p>}
      <button className="btn primary" disabled={bezig}>
        {bezig ? 'Bezig…' : 'Stuur inloglink'}
      </button>
    </form>
  );
}
