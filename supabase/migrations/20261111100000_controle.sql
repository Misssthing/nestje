-- Nestje, uitbreiding 26: controle voordat een nestje in het openbare overzicht komt.
-- Uitvoeren in Supabase → SQL Editor: alles plakken en één keer op Run drukken. Mag gerust vaker.
--
-- controle_status:  wacht        = nog niet gecontroleerd (nieuw, of iets belangrijks gewijzigd)
--                   goedgekeurd  = staat in het overzicht (als de verkoper dat aanzet)
--                   aanpassen    = afgekeurd met een reden; na een wijziging gaat het weer naar "wacht"
-- De eigen link (/n/...) werkt altijd, ook tijdens de controle.

-- Nieuwe kolommen. Bij de allereerste keer worden alle bestaande nestjes goedgekeurd,
-- zodat het overzicht niet leeg raakt. Draai je dit later nog eens, dan verandert er aan de status niets.
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'nests' and column_name = 'controle_status') then
    alter table public.nests add column controle_status text not null default 'goedgekeurd';
    alter table public.nests alter column controle_status set default 'wacht';
    update public.nests set controle_status = 'goedgekeurd';
  end if;
end $$;

alter table public.nests add column if not exists controle_reden text;
alter table public.nests add column if not exists gecontroleerd_op timestamptz;
alter table public.nests add column if not exists ter_controle_op timestamptz default now();

do $$ begin
  alter table public.nests add constraint nests_controle_status_check
    check (controle_status in ('wacht', 'goedgekeurd', 'aanpassen'));
exception when duplicate_object then null; end $$;

-- Verkopers mogen hun eigen controlestatus niet wijzigen. Verandert er iets belangrijks
-- (ras, stamboom, foto van de moeder, soort), dan gaat een goedgekeurd of afgekeurd nestje terug naar "wacht".
create or replace function public.nestje_controle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  verkoper boolean := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') in ('authenticated', 'anon');
begin
  if not verkoper then
    return new; -- Nestje-server (service role) of SQL Editor: alles mag
  end if;

  if tg_op = 'INSERT' then
    new.controle_status := 'wacht';
    new.controle_reden := null;
    new.gecontroleerd_op := null;
    new.ter_controle_op := now();
    return new;
  end if;

  -- Na "aanpassen" mag de verkoper zelf opnieuw indienen (terug naar "wacht")
  if old.controle_status = 'aanpassen' and new.controle_status = 'wacht' then
    new.controle_reden := old.controle_reden;
    new.gecontroleerd_op := old.gecontroleerd_op;
    new.ter_controle_op := now();
    return new;
  end if;

  -- Verder blijven status en reden zoals ze waren
  new.controle_status := old.controle_status;
  new.controle_reden := old.controle_reden;
  new.gecontroleerd_op := old.gecontroleerd_op;
  new.ter_controle_op := old.ter_controle_op;

  if (new.moeder_ras, new.vader_ras, new.stamboom, new.moeder_foto, new.soort,
      new.stamboom_organisatie, new.cattery, new.moeder_stamboomnr, new.vader_stamboomnr, new.vader_naam)
     is distinct from
     (old.moeder_ras, old.vader_ras, old.stamboom, old.moeder_foto, old.soort,
      old.stamboom_organisatie, old.cattery, old.moeder_stamboomnr, old.vader_stamboomnr, old.vader_naam)
  then
    new.controle_status := 'wacht';
    new.ter_controle_op := now();
  end if;
  return new;
end;
$$;

drop trigger if exists nestje_controle on public.nests;
create trigger nestje_controle
  before insert or update on public.nests
  for each row execute function public.nestje_controle();

-- Openbaar overzicht: alleen goedgekeurde nestjes. Verder hetzelfde als uitbreiding 20.
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
             where k.nest_id = n.id order by k.volgorde, kp.volgorde limit 1),
           n.moeder_foto
         ) as foto,
         n.soort,
         case
           when n.soort = 'vondeling' then null
           when n.stamboom is true and nullif(trim(n.cattery), '') is not null
                and nullif(trim(n.stamboom_organisatie), '') is not null then 'fokker'
           else 'particulier'
         end as verkoper,
         (select min(x.aangemaakt_op) from public.nests x where x.owner_id = n.owner_id) as lid_sinds,
         array(
           select x.pad from (
             select f.storage_path as pad, 0 as groep, f.volgorde as o1, 0 as o2
               from public.nest_photos f where f.nest_id = n.id
             union all
             select kf.pad, kf.groep, kf.o1, kf.o2 from (
               select distinct on (k.id) kp.storage_path as pad, 1 as groep, k.volgorde as o1, kp.volgorde as o2
                 from public.kitten_photos kp
                 join public.kittens k on k.id = kp.kitten_id
                where k.nest_id = n.id
                order by k.id, kp.volgorde
             ) kf
           ) x
           order by x.groep, x.o1, x.o2
           limit 6
         ) as fotos
  from public.nests n
  where n.in_overzicht
    and n.controle_status = 'goedgekeurd'
    and not n.verborgen
    and not n.afgerond
    and (n.soort = 'vondeling' or n.moeder_foto is not null)
    and (
      n.geboortedatum > current_date
      or exists (select 1 from public.kittens k where k.nest_id = n.id and k.status in ('vrij', 'optie'))
    );

grant select on public.openbare_overzicht to anon, authenticated;
