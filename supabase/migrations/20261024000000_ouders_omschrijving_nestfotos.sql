-- Nestje, uitbreiding 1: vader (optioneel), omschrijving per kitten, nestfoto's
-- Uitvoeren ná 20261023000000_nestje.sql.

-- ─────────────────────────────────────────────────────────────
-- Nieuwe kolommen
-- ─────────────────────────────────────────────────────────────
alter table public.nests
  add column vader_naam text check (char_length(vader_naam) <= 60),
  add column over_vader text check (char_length(over_vader) <= 1000);

alter table public.kittens
  add column omschrijving text check (char_length(omschrijving) <= 300);

-- ─────────────────────────────────────────────────────────────
-- Nestfoto's: max. 3 per nestje, paden <nest_id>/nest/<uuid>.jpg
-- (de bestaande storage-policies controleren al op de eerste map = nest_id)
-- ─────────────────────────────────────────────────────────────
create table public.nest_photos (
  id           uuid primary key default gen_random_uuid(),
  nest_id      uuid not null references public.nests (id) on delete cascade,
  storage_path text not null unique,
  volgorde     int  not null default 0
);
create index nest_photos_nest_idx on public.nest_photos (nest_id, volgorde);

create or replace function public.check_max_nestfotos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.nest_photos where nest_id = new.nest_id) >= 3 then
    raise exception 'Maximaal 3 nestfoto''s';
  end if;
  return new;
end;
$$;

create trigger nest_photos_max
  before insert on public.nest_photos
  for each row execute function public.check_max_nestfotos();

alter table public.nest_photos enable row level security;

create policy "eigenaar beheert nestfotos" on public.nest_photos
  for all to authenticated
  using (public.is_nest_owner(nest_id))
  with check (public.is_nest_owner(nest_id));

revoke all on public.nest_photos from anon;
grant select, insert, update, delete on public.nest_photos to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Openbare views bijwerken (nieuwe kolommen achteraan, zoals
-- create or replace view vereist)
-- ─────────────────────────────────────────────────────────────
create or replace view public.openbare_nesten with (security_invoker = false) as
  select id, slug, moeder_naam, woonplaats, geboortedatum,
         verhuisleeftijd_weken, prijs, over_moeder,
         (whatsapp_nummer is not null) as heeft_whatsapp,
         vader_naam, over_vader
  from public.nests;

create or replace view public.openbare_kittens with (security_invoker = false) as
  select id, nest_id, naam, geslacht, vacht, status, volgorde, omschrijving
  from public.kittens;

create view public.openbare_nestfotos with (security_invoker = false) as
  select id, nest_id, storage_path, volgorde
  from public.nest_photos;

grant select on public.openbare_nesten, public.openbare_kittens, public.openbare_nestfotos to anon, authenticated;
