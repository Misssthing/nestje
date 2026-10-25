'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function MeldForm({ slug }: { slug: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [reden, setReden] = useState('');
  const [status, setStatus] = useState<'invullen' | 'bezig' | 'klaar' | 'fout'>('invullen');

  async function verstuur(e: React.FormEvent) {
    e.preventDefault();
    if (reden.trim().length < 3) return;
    setStatus('bezig');
    const { data, error } = await supabase.rpc('meld_nestje', { p_slug: slug, p_reden: reden });
    setStatus(error || !data ? 'fout' : 'klaar');
  }

  if (status === 'klaar') {
    return (
      <section className="panel">
        <h2>Bedankt voor je melding</h2>
        <p className="hint" style={{ marginTop: -4 }}>We kijken ernaar en halen het nestje zo nodig uit het overzicht.</p>
        <div className="actions">
          <Link className="btn ghost" href="/kittens">Terug naar het overzicht</Link>
        </div>
      </section>
    );
  }

  return (
    <form className="panel" onSubmit={verstuur}>
      <label className="veld">
        <span>Wat klopt er niet?</span>
        <textarea value={reden} maxLength={500} onChange={(e) => setReden(e.target.value)} required />
        <p className="hint teller">{reden.length}/500</p>
      </label>
      {status === 'fout' && <p className="fout">Versturen lukte niet. Probeer het later nog eens.</p>}
      <div className="actions">
        <button className="btn primary" disabled={status === 'bezig' || reden.trim().length < 3}>
          {status === 'bezig' ? 'Bezig…' : 'Melding versturen'}
        </button>
      </div>
    </form>
  );
}
