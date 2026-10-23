'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { CONFIG, fotoUrl } from '@/lib/config';
import { verkleinFoto } from '@/lib/foto';
import type { FotoRij } from '@/lib/types';

type Props<T extends FotoRij> = {
  supabase: SupabaseClient;
  fotos: T[];
  max: number;
  tabel: 'kitten_photos' | 'nest_photos';
  ouder: { kolom: 'kitten_id' | 'nest_id'; id: string };
  /** Map in de bucket, begint altijd met het nest-id (vereist door de storage-policy) */
  map: string;
  naam: string;
  onFotos: (fn: (f: T[]) => T[]) => void;
};

/** Uploaden (verkleind tot 1600px), verwijderen en omslag kiezen voor kitten- of nestfoto's. */
export default function FotoBeheer<T extends FotoRij>({ supabase, fotos, max, tabel, ouder, map, naam, onFotos }: Props<T>) {
  const toast = useToast();
  const [uploads, setUploads] = useState(0);
  const ruimte = max - fotos.length - uploads;

  async function upload(bestanden: FileList | null) {
    if (!bestanden?.length) return;
    const lijst = Array.from(bestanden).slice(0, Math.max(0, ruimte));
    if (bestanden.length > lijst.length) toast(`Maximaal ${max} foto's`);
    if (!lijst.length) return;

    setUploads(lijst.length);
    let volgorde = fotos.length ? Math.max(...fotos.map((f) => f.volgorde)) + 1 : 0;
    let mislukt = 0;

    for (const bestand of lijst) {
      try {
        const blob = await verkleinFoto(bestand);
        const pad = `${map}/${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(CONFIG.fotoBucket)
          .upload(pad, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
        if (upErr) throw upErr;

        const { data, error } = await supabase
          .from(tabel)
          .insert({ [ouder.kolom]: ouder.id, storage_path: pad, volgorde: volgorde++ })
          .select()
          .single<T>();
        if (error || !data) {
          await supabase.storage.from(CONFIG.fotoBucket).remove([pad]);
          throw error;
        }
        onFotos((f) => [...f, data]);
      } catch {
        mislukt++;
      } finally {
        setUploads((u) => u - 1);
      }
    }
    toast(mislukt ? `${mislukt} foto('s) uploaden lukte niet` : lijst.length === 1 ? 'Foto toegevoegd' : "Foto's toegevoegd");
  }

  async function verwijder(f: T) {
    onFotos((l) => l.filter((x) => x.id !== f.id));
    const { error } = await supabase.from(tabel).delete().eq('id', f.id);
    if (error) {
      onFotos((l) => [...l, f].sort((a, b) => a.volgorde - b.volgorde));
      return toast('Verwijderen lukte niet');
    }
    await supabase.storage.from(CONFIG.fotoBucket).remove([f.storage_path]);
  }

  async function maakOmslag(f: T) {
    const nieuw = [f, ...fotos.filter((x) => x.id !== f.id)].map((x, i) => ({ ...x, volgorde: i }));
    onFotos(() => nieuw);
    const res = await Promise.all(nieuw.map((x) => supabase.from(tabel).update({ volgorde: x.volgorde }).eq('id', x.id)));
    toast(res.some((r) => r.error) ? 'Volgorde opslaan lukte niet' : 'Omslagfoto ingesteld');
  }

  return (
    <div className="thumbs" style={{ gridTemplateColumns: `repeat(${max}, 1fr)` }}>
      {fotos.map((f, i) => (
        <div key={f.id} className={`thumb${i === 0 ? ' eerste' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoUrl(f.storage_path)} alt={`Foto ${i + 1} van ${naam}`} loading="lazy" />
          <button className="x" onClick={() => verwijder(f)} aria-label={`Foto ${i + 1} verwijderen`}>×</button>
          {i > 0 && <button className="omslag" onClick={() => maakOmslag(f)}>Omslag</button>}
        </div>
      ))}
      {Array.from({ length: uploads }, (_, i) => (
        <div key={`u${i}`} className="thumb bezig">Bezig…</div>
      ))}
      {ruimte > 0 && (
        <label className="thumb toevoegen" aria-label={`Foto's toevoegen voor ${naam}`}>
          +
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              upload(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}
