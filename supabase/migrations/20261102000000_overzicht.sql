-- Nestje, uitbreiding 11: openbaar overzicht van nestjes (opt-in) en melden

alter table public.nests
  add column if not exists in_overzicht boolean not null default false,
  add column if not exists provincie    text,
  add column if not exists verborgen    boolean not null default false;

alter table public.nests drop constraint if exists nests_provincie_check;
alter table public.nests add constraint nests_provincie_check check (
  provincie is null or provincie in (
    'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg',
    'Noord-Brabant', 'Noord-Holland', 'Overijssel', 'Utrecht', 'Zeeland', 'Zuid-Holland', 'België'
  )
);

-- Openbaar overzicht: alleen nestjes waarvan de verkoper dat wil, die lopen,
-- niet verborgen zijn en nog een kitten vrij of onder optie hebben.
create or replace view public.openbare_overzicht with (security_invoker = false) as
  select n.slug, n.moeder_naam, n.woonplaats, n.provincie,
         n.moeder_ras, n.vader_ras, n.stamboom,
         n.geboortedatum, n.verhuisleeftijd_weken, n.prijs, n.aangemaakt_op,
         (select count(*) from public.kittens k where k.nest_id = n.id)::int as kittens,
         (select count(*) from public.kittens k where k.nest_id = n.id and k.status = 'vrij')::int as vrij,
         (select count(*) from public.kittens k where k.nest_id = n.id and k.status = 'optie')::int as optie,
         coalesce(
           (select f.storage_path from public.nest_photos f where f.nest_id = n.id order by f.volgorde limit 1),
           (select kp.storage_path from public.kitten_photos kp
              join public.kittens k on k.id = kp.kitten_id
             where k.nest_id = n.id order by k.volgorde, kp.volgorde limit 1)
         ) as foto
  from public.nests n
  where n.in_overzicht
    and not n.verborgen
    and not n.afgerond
    and exists (select 1 from public.kittens k where k.nest_id = n.id and k.status in ('vrij', 'optie'));

grant select on public.openbare_overzicht to anon, authenticated;

-- Meldingen van bezoekers. Niemand kan ze via de app lezen; jij leest ze in de SQL Editor.
create table if not exists public.meldingen (
  id      bigint generated always as identity primary key,
  nest_id uuid not null references public.nests (id) on delete cascade,
  reden   text not null check (char_length(reden) between 3 and 500),
  op      timestamptz not null default now()
);
alter table public.meldingen enable row level security;

create or replace function public.meld_nestje(p_slug text, p_reden text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_nest uuid;
begin
  select id into v_nest from public.nests where slug = p_slug;
  if v_nest is null or char_length(coalesce(trim(p_reden), '')) < 3 then
    return false;
  end if;
  insert into public.meldingen (nest_id, reden) values (v_nest, left(trim(p_reden), 500));
  return true;
end;
$$;

revoke execute on function public.meld_nestje(text, text) from public;
grant execute on function public.meld_nestje(text, text) to anon, authenticated;
