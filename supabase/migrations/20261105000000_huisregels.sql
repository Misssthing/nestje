-- Nestje, uitbreiding 14: huisregels
-- Verhuisleeftijd minstens 12 weken, soort nestje (eigen poes of vondelingen),
-- stamboomgegevens, testen per ouder, verboden rassen en grenzen aan het aantal nestjes.

-- 1. Nieuwe velden
alter table public.nests
  add column if not exists soort                text not null default 'eigen',
  add column if not exists stamboom_organisatie text,
  add column if not exists cattery              text,
  add column if not exists moeder_stamboomnr    text,
  add column if not exists vader_stamboomnr     text,
  add column if not exists moeder_chip          text,
  add column if not exists moeder_testen        jsonb not null default '[]'::jsonb,
  add column if not exists vader_testen         jsonb not null default '[]'::jsonb;

alter table public.nests drop constraint if exists nests_soort_check;
alter table public.nests add constraint nests_soort_check check (soort in ('eigen', 'vondeling'));

-- 2. Verhuisleeftijd: minstens 12 weken (bestaande nestjes onder de 12 gaan naar 12)
update public.nests set verhuisleeftijd_weken = 12 where verhuisleeftijd_weken < 12;
alter table public.nests drop constraint if exists nests_verhuisleeftijd_weken_check;
alter table public.nests
  add constraint nests_verhuisleeftijd_weken_check check (verhuisleeftijd_weken between 12 and 26);
alter table public.nests alter column verhuisleeftijd_weken set default 13;

-- 3. Accounts die meer nestjes mogen (bijvoorbeeld een opvang). Alleen jij beheert dit, in de SQL Editor.
create table if not exists public.ruime_accounts (
  owner_id   uuid primary key references auth.users (id) on delete cascade,
  reden      text,
  sinds      timestamptz not null default now()
);
alter table public.ruime_accounts enable row level security;

-- 4. Verboden rassen (fokverbod in Nederland: naaktkatten en katten met vouworen)
create or replace function public.nestje_controleer_ras()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if lower(coalesce(new.moeder_ras, '') || ' ' || coalesce(new.vader_ras, ''))
       ~ '(sphynx|naakt|fold|levkoy|bambino|donskoy|peterbald|\mdwelf\M|\melf\M)' then
    raise exception 'NESTJE: Met dit ras mag in Nederland niet worden gefokt. Naaktkatten en katten met vouworen kunnen daarom niet op Nestje.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists nestje_ras on public.nests;
create trigger nestje_ras
  before insert or update of moeder_ras, vader_ras on public.nests
  for each row
  when (pg_trigger_depth() = 0)
  execute function public.nestje_controleer_ras();

-- 5. Grenzen per account: maximaal 2 lopende nestjes en 4 per 12 maanden
create or replace function public.nestje_controleer_aantal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lopend int;
  v_jaar   int;
begin
  if exists (select 1 from public.ruime_accounts r where r.owner_id = new.owner_id) then
    return new;
  end if;

  select count(*) into v_lopend from public.nests n where n.owner_id = new.owner_id and not n.afgerond;
  if v_lopend >= 2 then
    raise exception 'NESTJE: Je hebt al 2 lopende nestjes. Rond er eerst één af voordat je een nieuw nestje maakt.'
      using errcode = 'P0001';
  end if;

  select count(*) into v_jaar from public.nests n
   where n.owner_id = new.owner_id and n.aangemaakt_op > now() - interval '12 months';
  if v_jaar >= 4 then
    raise exception 'NESTJE: Je hebt de afgelopen 12 maanden al 4 nestjes gemaakt. Dat is het maximum op Nestje.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists nestje_aantal on public.nests;
create trigger nestje_aantal
  before insert on public.nests
  for each row execute function public.nestje_controleer_aantal();

-- 6. Grenzen per poes: maximaal 2 nestjes per 12 maanden en 3 per 24 maanden (niet bij vondelingen)
create or replace function public.nestje_controleer_poes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_12 int;
  v_24 int;
begin
  if new.soort = 'vondeling' then
    return new;
  end if;
  if exists (select 1 from public.ruime_accounts r where r.owner_id = new.owner_id) then
    return new;
  end if;

  select
    count(*) filter (where abs(n.geboortedatum - new.geboortedatum) < 365),
    count(*) filter (where abs(n.geboortedatum - new.geboortedatum) < 730)
    into v_12, v_24
  from public.nests n
  where n.owner_id = new.owner_id
    and n.id <> new.id
    and n.soort <> 'vondeling'
    and (
      (new.moeder_chip is not null and n.moeder_chip is not null
         and replace(n.moeder_chip, ' ', '') = replace(new.moeder_chip, ' ', ''))
      or lower(trim(n.moeder_naam)) = lower(trim(new.moeder_naam))
    );

  if v_12 >= 2 then
    raise exception 'NESTJE: Deze poes heeft binnen 12 maanden al 2 nestjes. Volgens de huisregels kan er geen derde bij.'
      using errcode = 'P0001';
  end if;
  if v_24 >= 3 then
    raise exception 'NESTJE: Deze poes heeft binnen 24 maanden al 3 nestjes. Volgens de huisregels kan er geen vierde bij.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists nestje_poes on public.nests;
create trigger nestje_poes
  before insert or update of moeder_naam, moeder_chip, geboortedatum, soort on public.nests
  for each row execute function public.nestje_controleer_poes();

-- 7. Openbare weergave: nieuwe velden (zonder chipnummer van de moeder)
create or replace view public.openbare_nesten with (security_invoker = false) as
  select id, slug, moeder_naam, woonplaats, geboortedatum,
         verhuisleeftijd_weken, prijs, over_moeder,
         (whatsapp_nummer is not null) as heeft_whatsapp,
         vader_naam, over_vader,
         moeder_ras, vader_ras,
         stamboom, ouders_getest, ouders_test_info,
         moeder_gewicht, vader_gewicht, moeder_foto, vader_foto,
         afgerond, gezondheid_bij_verhuizing, geboortedatum_geschat,
         soort, stamboom_organisatie, cattery, moeder_stamboomnr, vader_stamboomnr,
         moeder_testen, vader_testen
  from public.nests;

grant select on public.openbare_nesten to anon, authenticated;

-- 8. Overzicht: alleen met een foto van de moeder (behalve vondelingen), en met soort voor het label
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
         n.soort
  from public.nests n
  where n.in_overzicht
    and not n.verborgen
    and not n.afgerond
    and (n.soort = 'vondeling' or n.moeder_foto is not null)
    and (
      n.stamboom is not true
      or (n.stamboom_organisatie is not null and n.cattery is not null and n.moeder_stamboomnr is not null
          and n.vader_stamboomnr is not null and nullif(trim(n.vader_naam), '') is not null)
    )
    and (
      n.geboortedatum > current_date
      or exists (select 1 from public.kittens k where k.nest_id = n.id and k.status in ('vrij', 'optie'))
    );

grant select on public.openbare_overzicht to anon, authenticated;
