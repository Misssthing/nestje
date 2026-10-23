-- Nestje: datamodel, Row Level Security, openbare views en storage
-- Uitvoeren in Supabase → SQL Editor (in één keer), of met `supabase db push`.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Korte, leesbare slug (geen 0/o, 1/l/i om tikfouten te voorkomen)
-- ─────────────────────────────────────────────────────────────
create or replace function public.nieuwe_slug()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alfabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  s text;
begin
  loop
    s := '';
    for i in 1..6 loop
      s := s || substr(alfabet, 1 + floor(random() * length(alfabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.nests where slug = s);
  end loop;
  return s;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Tabellen
-- ─────────────────────────────────────────────────────────────
create table public.nests (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug                  text not null unique default public.nieuwe_slug()
                          check (slug ~ '^[a-z0-9-]{4,40}$'),
  moeder_naam           text not null check (char_length(moeder_naam) between 1 and 60),
  woonplaats            text check (char_length(woonplaats) <= 80),
  geboortedatum         date not null,
  verhuisleeftijd_weken int  not null default 13 check (verhuisleeftijd_weken between 8 and 26),
  prijs                 numeric(8,2) check (prijs >= 0),
  whatsapp_nummer       text check (whatsapp_nummer ~ '^[1-9][0-9]{7,14}$'),
  over_moeder           text check (char_length(over_moeder) <= 2000),
  aangemaakt_op         timestamptz not null default now()
);

-- MVP: één nestje per verkoper tegelijk. Later weghalen voor meerdere nestjes.
create unique index nests_een_per_verkoper on public.nests (owner_id);

create table public.kittens (
  id       uuid primary key default gen_random_uuid(),
  nest_id  uuid not null references public.nests (id) on delete cascade,
  naam     text not null check (char_length(naam) between 1 and 40),
  geslacht text not null default 'poes' check (geslacht in ('kater', 'poes')),
  vacht    text check (char_length(vacht) <= 60),
  status   text not null default 'vrij' check (status in ('vrij', 'gereserveerd', 'verhuisd')),
  volgorde int  not null default 0
);
create index kittens_nest_idx on public.kittens (nest_id, volgorde);

create table public.kitten_photos (
  id           uuid primary key default gen_random_uuid(),
  kitten_id    uuid not null references public.kittens (id) on delete cascade,
  storage_path text not null unique,
  volgorde     int  not null default 0
);
create index kitten_photos_kitten_idx on public.kitten_photos (kitten_id, volgorde);

-- Maximaal 5 foto's per kitten, ook als iemand de app omzeilt
create or replace function public.check_max_fotos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.kitten_photos where kitten_id = new.kitten_id) >= 5 then
    raise exception 'Maximaal 5 foto''s per kitten';
  end if;
  return new;
end;
$$;

create trigger kitten_photos_max
  before insert on public.kitten_photos
  for each row execute function public.check_max_fotos();

-- ─────────────────────────────────────────────────────────────
-- Eigenaarscheck (security definer zodat policies niet recursief worden)
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_nest_owner(p_nest uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.nests
    where id = p_nest and owner_id = (select auth.uid())
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security: alleen de eigenaar leest en schrijft de tabellen
-- ─────────────────────────────────────────────────────────────
alter table public.nests         enable row level security;
alter table public.kittens       enable row level security;
alter table public.kitten_photos enable row level security;

create policy "eigenaar beheert nest" on public.nests
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "eigenaar beheert kittens" on public.kittens
  for all to authenticated
  using (public.is_nest_owner(nest_id))
  with check (public.is_nest_owner(nest_id));

create policy "eigenaar beheert fotos" on public.kitten_photos
  for all to authenticated
  using (exists (
    select 1 from public.kittens k
    where k.id = kitten_id and public.is_nest_owner(k.nest_id)
  ))
  with check (exists (
    select 1 from public.kittens k
    where k.id = kitten_id and public.is_nest_owner(k.nest_id)
  ));

-- Anoniem: geen enkele toegang tot de tabellen zelf
revoke all on public.nests, public.kittens, public.kitten_photos from anon;
grant select, insert, update, delete on public.nests, public.kittens, public.kitten_photos to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Openbare views: zonder owner_id, e-mail of telefoonnummer.
-- security_invoker = false: de view leest als eigenaar (postgres) en
-- omzeilt daarmee bewust RLS, maar toont alleen deze kolommen.
-- ─────────────────────────────────────────────────────────────
create view public.openbare_nesten with (security_invoker = false) as
  select id, slug, moeder_naam, woonplaats, geboortedatum,
         verhuisleeftijd_weken, prijs, over_moeder,
         (whatsapp_nummer is not null) as heeft_whatsapp
  from public.nests;

create view public.openbare_kittens with (security_invoker = false) as
  select id, nest_id, naam, geslacht, vacht, status, volgorde
  from public.kittens;

create view public.openbare_fotos with (security_invoker = false) as
  select id, kitten_id, storage_path, volgorde
  from public.kitten_photos;

grant select on public.openbare_nesten, public.openbare_kittens, public.openbare_fotos to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- WhatsApp-doorverwijzing: geeft het nummer alleen voor een vrij kitten,
-- zodat het nooit in de HTML van de openbare pagina staat.
-- ─────────────────────────────────────────────────────────────
create or replace function public.whatsapp_gegevens(p_slug text, p_kitten uuid)
returns table (nummer text, moeder_naam text, kitten_naam text)
language sql
stable
security definer
set search_path = ''
as $$
  select n.whatsapp_nummer, n.moeder_naam, k.naam
  from public.nests n
  join public.kittens k on k.nest_id = n.id
  where n.slug = p_slug
    and k.id = p_kitten
    and k.status = 'vrij'
    and n.whatsapp_nummer is not null;
$$;

revoke execute on function public.whatsapp_gegevens(text, uuid) from public;
grant execute on function public.whatsapp_gegevens(text, uuid) to anon, authenticated;

revoke execute on function public.is_nest_owner(uuid) from public, anon;
grant execute on function public.is_nest_owner(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Storage: publieke bucket, paden <nest_id>/<kitten_id>/<bestand>.jpg
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kitten-fotos', 'kitten-fotos', true, 5242880, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

create policy "eigenaar leest eigen fotomap" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'kitten-fotos'
    and exists (select 1 from public.nests n
                where n.id::text = (storage.foldername(name))[1]
                  and n.owner_id = (select auth.uid()))
  );

create policy "eigenaar uploadt in eigen fotomap" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kitten-fotos'
    and exists (select 1 from public.nests n
                where n.id::text = (storage.foldername(name))[1]
                  and n.owner_id = (select auth.uid()))
  );

create policy "eigenaar wijzigt eigen fotomap" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'kitten-fotos'
    and exists (select 1 from public.nests n
                where n.id::text = (storage.foldername(name))[1]
                  and n.owner_id = (select auth.uid()))
  );

create policy "eigenaar verwijdert uit eigen fotomap" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'kitten-fotos'
    and exists (select 1 from public.nests n
                where n.id::text = (storage.foldername(name))[1]
                  and n.owner_id = (select auth.uid()))
  );
