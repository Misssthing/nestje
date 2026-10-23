'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Aftelling from '@/components/Aftelling';
import FotoBeheer from '@/components/FotoBeheer';
import KopieerLink from '@/components/KopieerLink';
import { useToast } from '@/components/Toast';
import { CONFIG } from '@/lib/config';
import { aantalKittens, STATUS_LABEL } from '@/lib/nest';
import { createClient } from '@/lib/supabase/browser';
import type { Foto, Kitten, KittenMetFotos, Nest, NestFoto } from '@/lib/types';
import KittenKaart from './KittenKaart';
import NestForm from './NestForm';

const sorteer = (k: KittenMetFotos[]) =>
  [...k]
    .sort((a, b) => a.volgorde - b.volgorde)
    .map((x) => ({ ...x, kitten_photos: [...x.kitten_photos].sort((a, b) => a.volgorde - b.volgorde) }));

export default function Beheer({
  nest: beginNest,
  nestFotos: beginNestFotos,
  kittens: beginKittens,
  email,
}: {
  nest: Nest;
  nestFotos: NestFoto[];
  kittens: KittenMetFotos[];
  email: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const toast = useToast();
  const [nest, setNest] = useState(beginNest);
  const [kittens, setKittens] = useState(() => sorteer(beginKittens));
  const [nestFotos, setNestFotos] = useState(beginNestFotos);
  const [origin, setOrigin] = useState(CONFIG.siteUrl);
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/n/${nest.slug}`;

  async function werkKittenBij(id: string, patch: Partial<Kitten>, melding?: string) {
    const vorig = kittens;
    setKittens((ks) => ks.map((k) => (k.id === id ? { ...k, ...patch } : k)));
    const { error } = await supabase.from('kittens').update(patch).eq('id', id);
    if (error) {
      setKittens(vorig);
      toast('Opslaan lukte niet');
    } else if (melding) toast(melding);
  }

  function zetFotos(id: string, fn: (f: Foto[]) => Foto[]) {
    setKittens((ks) => ks.map((k) => (k.id === id ? { ...k, kitten_photos: fn(k.kitten_photos) } : k)));
  }

  async function voegToe() {
    const volgorde = kittens.length ? Math.max(...kittens.map((k) => k.volgorde)) + 1 : 0;
    const { data, error } = await supabase
      .from('kittens')
      .insert({ nest_id: nest.id, naam: `Kitten ${kittens.length + 1}`, volgorde })
      .select('*, kitten_photos(*)')
      .single<KittenMetFotos>();
    if (error || !data) return toast('Toevoegen lukte niet');
    setKittens((ks) => [...ks, data]);
    toast('Kitten toegevoegd');
  }

  async function verwijder(k: KittenMetFotos) {
    if (!confirm(`${k.naam} verwijderen, inclusief foto's?`)) return;
    const paden = k.kitten_photos.map((f) => f.storage_path);
    if (paden.length) await supabase.storage.from(CONFIG.fotoBucket).remove(paden);
    const { error } = await supabase.from('kittens').delete().eq('id', k.id);
    if (error) return toast('Verwijderen lukte niet');
    setKittens((ks) => ks.filter((x) => x.id !== k.id));
    toast(`${k.naam} verwijderd`);
  }

  async function verplaats(index: number, richting: -1 | 1) {
    const doel = index + richting;
    if (doel < 0 || doel >= kittens.length) return;
    const nieuw = [...kittens];
    [nieuw[index], nieuw[doel]] = [nieuw[doel], nieuw[index]];
    const hernummerd = nieuw.map((k, i) => ({ ...k, volgorde: i }));
    setKittens(hernummerd);
    const gewijzigd = hernummerd.filter((k, i) => i === index || i === doel);
    const resultaten = await Promise.all(
      gewijzigd.map((k) => supabase.from('kittens').update({ volgorde: k.volgorde }).eq('id', k.id)),
    );
    if (resultaten.some((r) => r.error)) toast('Volgorde opslaan lukte niet');
  }

  async function verwijderNestje() {
    if (!confirm('Je hele nestje verwijderen? De pagina en alle foto\'s zijn daarna weg.')) return;
    const paden = [
      ...nestFotos.map((f) => f.storage_path),
      ...kittens.flatMap((k) => k.kitten_photos.map((f) => f.storage_path)),
    ];
    if (paden.length) await supabase.storage.from(CONFIG.fotoBucket).remove(paden);
    const { error } = await supabase.from('nests').delete().eq('id', nest.id);
    if (error) return toast('Verwijderen lukte niet');
    router.refresh();
  }

  const vrij = kittens.filter((k) => k.status === 'vrij').length;

  return (
    <main className="wrap">
      <div className="bar">
        <span className="brand">Nestje</span>
        <form action="/auth/uitloggen" method="post">
          <button className="btn ghost klein">Uitloggen</button>
        </form>
      </div>

      <section className="hero">
        <h1>Het nestje van {nest.moeder_naam}</h1>
        <p>
          {aantalKittens(kittens.length)}, {vrij} {STATUS_LABEL.vrij.toLowerCase()}.
        </p>
        <Aftelling geboortedatum={nest.geboortedatum} weken={nest.verhuisleeftijd_weken} />
      </section>

      <section className="linkkaart" aria-label="Je openbare pagina">
        <span className="hint" style={{ margin: 0 }}>Je pagina voor kopers</span>
        <code>{url.replace(/^https?:\/\//, '')}</code>
        <div className="actions">
          <KopieerLink url={url} className="btn primary" />
          <a className="btn ghost" href={`/n/${nest.slug}`} target="_blank" rel="noopener">
            Bekijk pagina
          </a>
        </div>
        {!nest.whatsapp_nummer && (
          <p className="fout">Vul je WhatsApp-nummer in bij Gegevens, anders kunnen kopers je niet bereiken.</p>
        )}
      </section>

      <section className="panel" aria-label="Nestfoto's">
        <h2>Nestfoto&apos;s</h2>
        <p className="hint" style={{ marginTop: -4, marginBottom: 10 }}>
          Komen bovenaan je pagina en in de deelafbeelding. Bijvoorbeeld het hele nestje samen, of de moeder met haar kittens.
        </p>
        <FotoBeheer
          supabase={supabase}
          fotos={nestFotos}
          max={CONFIG.maxNestFotos}
          tabel="nest_photos"
          ouder={{ kolom: 'nest_id', id: nest.id }}
          map={`${nest.id}/nest`}
          naam={`het nestje van ${nest.moeder_naam}`}
          onFotos={setNestFotos}
        />
      </section>

      <h2 className="kop2">Kittens</h2>
      <div className="lijst">
        {kittens.map((k, i) => (
          <KittenKaart
            key={k.id}
            kitten={k}
            nestId={nest.id}
            supabase={supabase}
            eerste={i === 0}
            laatste={i === kittens.length - 1}
            onWijzig={(patch, melding) => werkKittenBij(k.id, patch, melding)}
            onFotos={(fn) => zetFotos(k.id, fn)}
            onVerwijder={() => verwijder(k)}
            onVerplaats={(r) => verplaats(i, r)}
          />
        ))}
      </div>
      <div className="actions">
        <button className="btn ghost" onClick={voegToe}>
          Kitten toevoegen
        </button>
      </div>

      <NestForm nest={nest} supabase={supabase} onOpgeslagen={setNest} openStandaard={!nest.whatsapp_nummer} />

      <details className="panel">
        <summary>Account</summary>
        <p className="hint" style={{ marginTop: 0 }}>Ingelogd als {email}</p>
        <div className="actions">
          <button className="btn danger" onClick={verwijderNestje}>
            Nestje verwijderen
          </button>
        </div>
      </details>
    </main>
  );
}
