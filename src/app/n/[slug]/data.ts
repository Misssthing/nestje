import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import type { Foto, Kitten, NestFoto, OpenbaarNest } from '@/lib/types';

export type OpenbaarKitten = Omit<Kitten, 'nest_id' | 'notitie'> & { fotos: string[] };

/** Leest één nestje via de openbare views (geen owner_id, e-mail of telefoonnummer). */
export const haalNestje = cache(async (slug: string) => {
  if (!/^[a-z0-9-]{4,40}$/.test(slug)) return null;
  const supabase = createPublicClient();

  const { data: nest } = await supabase
    .from('openbare_nesten')
    .select('*')
    .eq('slug', slug)
    .maybeSingle<OpenbaarNest>();
  if (!nest) return null;

  const { data: nestFotos } = await supabase
    .from('openbare_nestfotos')
    .select('storage_path, volgorde')
    .eq('nest_id', nest.id)
    .order('volgorde')
    .returns<Pick<NestFoto, 'storage_path' | 'volgorde'>[]>();

  const { data: kittens } = await supabase
    .from('openbare_kittens')
    .select('id, naam, geslacht, vacht, status, volgorde, omschrijving')
    .eq('nest_id', nest.id)
    .order('volgorde')
    .returns<Omit<Kitten, 'nest_id' | 'notitie'>[]>();

  const ids = (kittens ?? []).map((k) => k.id);
  const { data: fotos } = ids.length
    ? await supabase
        .from('openbare_fotos')
        .select('kitten_id, storage_path, volgorde')
        .in('kitten_id', ids)
        .order('volgorde')
        .returns<Omit<Foto, 'id'>[]>()
    : { data: [] as Omit<Foto, 'id'>[] };

  const perKitten = new Map<string, string[]>();
  for (const f of fotos ?? []) {
    perKitten.set(f.kitten_id, [...(perKitten.get(f.kitten_id) ?? []), f.storage_path]);
  }

  return {
    nest,
    nestFotos: (nestFotos ?? []).map((f) => f.storage_path),
    kittens: (kittens ?? []).map<OpenbaarKitten>((k) => ({ ...k, fotos: perKitten.get(k.id) ?? [] })),
  };
});
