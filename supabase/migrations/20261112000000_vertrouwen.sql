-- Nestje, uitbreiding 28: gezondheid en vertrouwen per nestje, stamboomlabel alleen met gegevens,
-- en extra profielgegevens voor fokkers.
-- Uitvoeren in Supabase → SQL Editor: alles plakken en één keer op Run drukken. Mag gerust vaker.

-- ─── 1. Gezondheid en vertrouwen per nestje ───────────────────
-- Bij de allereerste keer nemen we over wat bij álle kittens van een nestje al was aangevinkt.
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'nests' and column_name = 'bezoek_mogelijk') then
    alter table public.nests
      add column dierenarts boolean not null default false,
      add column enting1 boolean not null default false,
      add column enting2 boolean not null default false,
      add column ontwormd boolean not null default false,
      add column ontvlooid boolean not null default false,
      add column gechipt boolean not null default false,
      add column paspoort boolean not null default false,
      add column stamboom_papieren boolean not null default false,
      add column koopovereenkomst boolean not null default false,
      add column gesocialiseerd boolean not null default false,
      add column ouders_te_zien boolean not null default false,
      add column bezoek_mogelijk boolean not null default false;

    update public.nests n set
      dierenarts = coalesce((select bool_and(k.dierenarts) from public.kittens k where k.nest_id = n.id), false),
      enting1    = coalesce((select bool_and(k.enting1)    from public.kittens k where k.nest_id = n.id), false),
      enting2    = coalesce((select bool_and(k.enting2)    from public.kittens k where k.nest_id = n.id), false),
      ontwormd   = coalesce((select bool_and(k.ontwormd)   from public.kittens k where k.nest_id = n.id), false),
      ontvlooid  = coalesce((select bool_and(k.ontvlooid)  from public.kittens k where k.nest_id = n.id), false),
      gechipt    = coalesce((select bool_and(k.gechipt)    from public.kittens k where k.nest_id = n.id), false);
  end if;
end $$;

-- ─── 2. Extra profielgegevens voor fokkers ─────────────────────
alter table public.profielen add column if not exists sinds_jaar int;
alter table public.profielen add column if not exists rassen text;
alter table public.profielen add column if not exists vereniging text;

create or replace view public.openbare_profiel_extra with (security_invoker = false) as
  select p.slug, p.sinds_jaar, p.rassen, p.vereniging
  from public.profielen p
  where p.zichtbaar;
grant select on public.openbare_profiel_extra to anon, authenticated;

-- ─── 3. Nestjespagina: label "met stamboom" alleen met organisatie, catterynaam en naam vader ───
-- Ontbreken die, dan toont de pagina niets over een stamboom (in plaats van "met stamboom").
-- Zelfde kolommen als voorheen, met de gezondheidsvinkjes aan het eind.
create or replace view public.openbare_nesten with (security_invoker = false) as
  select n.id, n.slug, n.moeder_naam, n.woonplaats, n.geboortedatum,
         n.verhuisleeftijd_weken, n.prijs, n.over_moeder,
         (n.whatsapp_nummer is not null) as heeft_whatsapp,
         n.vader_naam, n.over_vader, n.moeder_ras, n.vader_ras,
         case when n.stamboom is true and not (nullif(trim(n.stamboom_organisatie), '') is not null and nullif(trim(n.cattery), '') is not null and nullif(trim(n.vader_naam), '') is not null) then null else n.stamboom end as stamboom,
         n.ouders_getest, n.ouders_test_info,
         n.moeder_gewicht, n.vader_gewicht, n.moeder_foto, n.vader_foto,
         n.afgerond, n.gezondheid_bij_verhuizing, n.geboortedatum_geschat,
         n.soort, n.stamboom_organisatie, n.cattery,
         n.moeder_testen, n.vader_testen,
         (select min(x.aangemaakt_op) from public.nests x where x.owner_id = n.owner_id) as lid_sinds,
         n.dierenarts, n.enting1, n.enting2, n.ontwormd, n.ontvlooid, n.gechipt, n.paspoort,
         n.stamboom_papieren, n.koopovereenkomst, n.gesocialiseerd, n.ouders_te_zien, n.bezoek_mogelijk,
         (n.moeder_stamboomnr is not null and n.vader_stamboomnr is not null) as stamboomnrs_bekend
  from public.nests n;

grant select on public.openbare_nesten to anon, authenticated;

-- ─── 4. Overzicht: zelfde regel voor het label "met stamboom". Verder ongewijzigd. ───
create or replace view public.openbare_overzicht with (security_invoker = false) as
  select n.slug, n.moeder_naam, n.woonplaats, n.provincie,
         n.moeder_ras, n.vader_ras,
         case when n.stamboom is true and not (nullif(trim(n.stamboom_organisatie), '') is not null and nullif(trim(n.cattery), '') is not null and nullif(trim(n.vader_naam), '') is not null) then null else n.stamboom end as stamboom,
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
