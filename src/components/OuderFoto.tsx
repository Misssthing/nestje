'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { CONFIG, fotoUrl } from '@/lib/config';
import { verkleinFoto } from '@/lib/foto';
import type { Nest } from '@/lib/types';

type Props = {
  supabase: SupabaseClient;
  nest: Nest;
  kolom: 'moeder_foto' | 'vader_foto';
  label: string;
  onWijzig: (patch: Partial<Nest>) => void;
};

/** Eén foto voor de moeder of de vader, opgeslagen als <nest_id>/ouders/<uuid>.jpg */
export default function OuderFoto({ supabase, nest, kolom, label, onWijzig }: Props) {
  const toast = useToast();
  const [bezig, setBezig] = useState(false);
  const huidig = nest[kolom];

  async function upload(bestanden: FileList | null) {
    const bestand = bestanden?.[0];
    if (!bestand) return;
    setBezig(true);
    try {
      const blob = await verkleinFoto(bestand);
      const pad = `${nest.id}/ouders/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from(CONFIG.fotoBucket)
        .upload(pad, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
      if (upErr) throw upErr;
      const { error } = await supabase.from('nests').update({ [kolom]: pad }).eq('id', nest.id);
      if (error) {
        await supabase.storage.from(CONFIG.fotoBucket).remove([pad]);
        throw error;
      }
      if (huidig) await supabase.storage.from(CONFIG.fotoBucket).remove([huidig]);
      onWijzig({ [kolom]: pad } as Partial<Nest>);
      toast('Foto opgeslagen');
    } catch {
      toast('Uploaden lukte niet');
    } finally {
      setBezig(false);
    }
  }

  async function verwijder() {
    if (!huidig) return;
    const { error } = await supabase.from('nests').update({ [kolom]: null }).eq('id', nest.id);
    if (error) return toast('Verwijderen lukte niet');
    await supabase.storage.from(CONFIG.fotoBucket).remove([huidig]);
    onWijzig({ [kolom]: null } as Partial<Nest>);
  }

  return (
    <div className="vak">
      <span>{label}</span>
      {bezig ? (
        <div className="thumb bezig">Bezig…</div>
      ) : huidig ? (
        <div className="thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoUrl(huidig)} alt={label} />
          <button className="x" onClick={verwijder} aria-label={`${label} verwijderen`}>×</button>
        </div>
      ) : (
        <label className="thumb toevoegen" aria-label={`${label} toevoegen`}>
          +
          <input
            type="file"
            accept="image/*"
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
