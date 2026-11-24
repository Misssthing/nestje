'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { CONFIG, fotoUrl } from '@/lib/config';
import { verkleinFoto } from '@/lib/foto';

type Props = {
  supabase: SupabaseClient;
  ownerId: string;
  foto: string | null;
  onWijzig: (foto: string | null) => void;
};

/**
 * Eén profielfoto van de verkoper zelf, opgeslagen als profiel/<owner_id>/<uuid>.jpg.
 * Verschijnt automatisch op de profielpagina en, zodra die aan staat, ook bij al je nestjes
 * (in het zijbalkje) — je uploadt 'm dus maar op één plek.
 */
export default function ProfielFoto({ supabase, ownerId, foto, onWijzig }: Props) {
  const toast = useToast();
  const [bezig, setBezig] = useState(false);

  async function upload(bestanden: FileList | null) {
    const bestand = bestanden?.[0];
    if (!bestand) return;
    setBezig(true);
    try {
      const blob = await verkleinFoto(bestand, 480);
      const pad = `profiel/${ownerId}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from(CONFIG.fotoBucket)
        .upload(pad, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
      if (upErr) throw upErr;
      const { error } = await supabase.from('profielen').update({ foto: pad }).eq('owner_id', ownerId);
      if (error) {
        await supabase.storage.from(CONFIG.fotoBucket).remove([pad]);
        throw error;
      }
      if (foto) await supabase.storage.from(CONFIG.fotoBucket).remove([foto]);
      onWijzig(pad);
      toast('Foto opgeslagen');
    } catch {
      toast('Uploaden lukte niet');
    } finally {
      setBezig(false);
    }
  }

  async function verwijder() {
    if (!foto) return;
    const { error } = await supabase.from('profielen').update({ foto: null }).eq('owner_id', ownerId);
    if (error) return toast('Verwijderen lukte niet');
    await supabase.storage.from(CONFIG.fotoBucket).remove([foto]);
    onWijzig(null);
  }

  return (
    <div className="vak rond">
      <span>Jouw foto</span>
      {bezig ? (
        <div className="thumb bezig">Bezig…</div>
      ) : foto ? (
        <div className="thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoUrl(foto)} alt="Jouw foto" />
          <button className="x" onClick={verwijder} aria-label="Foto verwijderen">×</button>
        </div>
      ) : (
        <label className="thumb toevoegen" aria-label="Foto toevoegen">
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
