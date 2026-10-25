-- Nestje, uitbreiding 9: optionele profielpagina per verkoper of opvang.
-- Eén vaste link (/v/naam) met alle lopende nestjes. Standaard uit.

create table if not exists public.profielen (
  owner_id      uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  naam          text not null check (char_length(naam) between 1 and 80),
  intro         text check (intro is null or char_length(intro) <= 500),
  zichtbaar     boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);

alter table public.profielen enable row level security;

create policy "eigenaar beheert profiel" on public.profielen
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.profielen from anon;
grant select, insert, update, delete on public.profielen to authenticated;

-- Openbaar: alleen zichtbare profielen, zonder owner_id.
create or replace view public.openbare_profielen with (security_invoker = false) as
  select slug, naam, intro
  from public.profielen
  where zichtbaar;

-- Openbaar: nestjes van zichtbare profielen, zonder owner_id of telefoonnummer.
create or replace view public.openbare_profiel_nesten with (security_invoker = false) as
  select p.slug  as profiel_slug,
         p.naam  as profiel_naam,
         n.slug, n.moeder_naam, n.woonplaats, n.geboortedatum,
         n.verhuisleeftijd_weken, n.afgerond, n.aangemaakt_op,
         (select count(*) from public.kittens k where k.nest_id = n.id)::int as kittens,
         (select count(*) from public.kittens k where k.nest_id = n.id and k.status = 'vrij')::int as vrij,
         coalesce(
           (select f.storage_path from public.nest_photos f where f.nest_id = n.id order by f.volgorde limit 1),
           (select kp.storage_path from public.kitten_photos kp
              join public.kittens k on k.id = kp.kitten_id
             where k.nest_id = n.id order by k.volgorde, kp.volgorde limit 1)
         ) as foto
  from public.profielen p
  join public.nests n on n.owner_id = p.owner_id
  where p.zichtbaar;

grant select on public.openbare_profielen, public.openbare_profiel_nesten to anon, authenticated;
