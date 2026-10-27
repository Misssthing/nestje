'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CONFIG } from '@/lib/config';
import { MAX_DAGEN_VOORUIT, nestjeMelding } from '@/lib/nest';
import { createClient } from '@/lib/supabase/browser';

export default function NieuwNestje({ eerste = false }: { eerste?: boolean }) {
  const router = useRouter();
  const [moeder, setMoeder] = useState('');
  const [geboren, setGeboren] = useState('');
  const [woonplaats, setWoonplaats] = useState('');
  const [aantal, setAantal] = useState(4);
  const [soort, setSoort] = useState<'eigen' | 'vondeling'>('eigen');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const uiterlijk = new Date(Date.now() + MAX_DAGEN_VOORUIT * 864e5).toISOString().slice(0, 10);

  async function maak(e: React.FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFout('');
    const supabase = createClient();
    const { data: nest, error } = await supabase
      .from('nests')
      .insert({
        moeder_naam: moeder.trim(),
        geboortedatum: geboren,
        woonplaats: woonplaats.trim() || null,
        verhuisleeftijd_weken: CONFIG.standaardVerhuisleeftijd,
        soort,
      })
      .select('id')
      .single<{ id: string }>();

    if (error || !nest) {
      setBezig(false);
      setFout(nestjeMelding(error, 'Aanmaken lukte niet. Probeer het opnieuw.'));
      return;
    }

    if (aantal > 0) {
      await supabase.from('kittens').insert(
        Array.from({ length: aantal }, (_, i) => ({
          nest_id: nest.id,
          naam: `Kitten ${i + 1}`,
          volgorde: i,
        })),
      );
    }
    router.push(`/beheer/${nest.id}`);
  }

  return (
    <main className="wrap">
      <div className="bar">
        {eerste ? <span className="brand">Nestje</span> : <a className="brand" href="/beheer">← Je nestjes</a>}
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn ghost klein" href="/hulp">Hulp</a>
          <form action="/auth/uitloggen" method="post">
            <button className="btn ghost klein">Uitloggen</button>
          </form>
        </div>
      </div>
      <section className="hero">
        <h1>{eerste ? 'Je nestje aanmaken' : 'Nieuw nestje'}</h1>
        <p>Drie gegevens en je pagina staat. Foto's, namen en de rest vul je daarna aan.</p>
      </section>
      <form className="panel" onSubmit={maak}>
        <div className="veld">
          <span>Soort nestje</span>
          <div className="seg" role="group" aria-label="Soort nestje">
            <button type="button" aria-pressed={soort === 'eigen'} onClick={() => setSoort('eigen')}>Eigen poes</button>
            <button type="button" aria-pressed={soort === 'vondeling'} onClick={() => setSoort('vondeling')}>Vondelingen</button>
          </div>
        </div>
        <label className="veld">
          <span>{soort === 'vondeling' ? 'Naam voor het nestje' : 'Naam van de moeder'}</span>
          <input value={moeder} onChange={(e) => setMoeder(e.target.value)} maxLength={60} required />
        </label>
        <div className="row stapel">
          <label className="veld">
            <span>Geboren op, of uitgerekende datum</span>
            <input type="date" value={geboren} max={uiterlijk} onChange={(e) => setGeboren(e.target.value)} required />
            <p className="hint">Zijn de kittens er nog niet? Vul de uitgerekende datum in, dan telt je pagina af tot de geboorte.</p>
          </label>
          <label className="veld">
            <span>Aantal kittens</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={12}
              value={aantal}
              onChange={(e) => setAantal(Math.max(0, Math.min(12, Number(e.target.value) || 0)))}
            />
          </label>
        </div>
        <label className="veld">
          <span>Woonplaats</span>
          <input value={woonplaats} onChange={(e) => setWoonplaats(e.target.value)} maxLength={80} />
          <p className="hint">Alleen je plaatsnaam, geen adres. Komt op de openbare pagina.</p>
        </label>
        {soort === 'vondeling' && (
          <p className="hint">Bijvoorbeeld “de vondelingetjes”. Je pagina heet dan “Het nestje van de vondelingetjes”.</p>
        )}
        <p className="hint">
          Door een nestje aan te maken, ga je akkoord met de <a href="/huisregels">huisregels</a>: onder meer chip en enting vóór
          de verhuizing, en verhuizen op zijn vroegst na 12 weken.
        </p>
        {fout && <p className="fout">{fout}</p>}
        <button className="btn primary" disabled={bezig}>
          {bezig ? 'Bezig…' : 'Nestje aanmaken'}
        </button>
      </form>
    </main>
  );
}
