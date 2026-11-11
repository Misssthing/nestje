-- Nestje, uitbreiding 39: een rasnaam alleen bij een volledige stamboom.
-- 1. Openbaar (overzicht, nestjespagina, filter op ras) tonen we een rasnaam alleen als het label
--    "Fokker · met stamboom" compleet is (stamboom Ja + organisatie + catterynaam + naam vader).
--    Zonder stamboom wordt een rasnaam "Huiskat". Stamboom Ja maar nog niet compleet: geen ras tot het compleet is.
--    Huiskat, Kruising en Europese korthaar blijven altijd gewoon staan.
-- 2. De database weigert voortaan een rasnaam zonder Stamboom op Ja (ook als iemand om het formulier heen gaat).
-- Uitvoeren in Supabase → SQL Editor: alles plakken en één keer op Run drukken. Mag gerust vaker.

-- ─── Welke rasnaam mag openbaar getoond worden ───
create or replace function public.nestje_ras_vrij(ras text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select not exists (
    select 1 from unnest(regexp_split_to_array(coalesce(ras, ''), '\s*×\s*')) d
    where nullif(trim(d), '') is not null
      and lower(trim(d)) not in ('huiskat', 'kruising', 'europese korthaar')
  );
$$;

create or replace function public.nestje_ras_openbaar(ras text, stamboom boolean, compleet boolean)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when ras is null or compleet or public.nestje_ras_vrij(ras) then ras
    when stamboom is true then null
    else 'Huiskat'
  end;
$$;

create or replace view public.openbare_nesten with (security_invoker = false) as
  select n.id, n.slug, n.moeder_naam, n.woonplaats, n.geboortedatum,
         n.verhuisleeftijd_weken, n.prijs, n.over_moeder,
         (n.whatsapp_nummer is not null) as heeft_whatsapp,
         n.vader_naam, n.over_vader,
         public.nestje_ras_openbaar(n.moeder_ras, n.stamboom, (n.stamboom is true and nullif(trim(n.stamboom_organisatie), '') is not null and nullif(trim(n.cattery), '') is not null and nullif(trim(n.vader_naam), '') is not null)) as moeder_ras,
         public.nestje_ras_openbaar(n.vader_ras, n.stamboom, (n.stamboom is true and nullif(trim(n.stamboom_organisatie), '') is not null and nullif(trim(n.cattery), '') is not null and nullif(trim(n.vader_naam), '') is not null)) as vader_ras,
         case when n.stamboom is true and not (nullif(trim(n.stamboom_organisatie), '') is not null and nullif(trim(n.cattery), '') is not null and nullif(trim(n.vader_naam), '') is not null) then null else n.stamboom end as stamboom,
         n.ouders_getest, n.ouders_test_info,
         n.moeder_gewicht, n.vader_gewicht, n.moeder_foto, n.vader_foto,
         n.afgerond, n.gezondheid_bij_verhuizing, n.geboortedatum_geschat,
         n.soort, n.stamboom_organisatie, n.cattery,
         n.moeder_testen, n.vader_testen,
         (select min(x.aangemaakt_op) from public.nests x where x.owner_id = n.owner_id) as lid_sinds,
         n.dierenarts, n.enting1, n.enting2, n.ontwormd, n.ontvlooid, n.gechipt, n.paspoort,
         n.stamboom_papieren, n.koopovereenkomst, n.gesocialiseerd, n.ouders_te_zien, n.bezoek_mogelijk,
         (n.moeder_stamboomnr is not null and n.vader_stamboomnr is not null) as stamboomnrs_bekend,
         (n.moeder_stamboomnr is not null and n.vader_stamboomnr is not null
          and exists (select 1 from public.catteries_gecontroleerd g where g.owner_id = n.owner_id and lower(trim(g.cattery)) = lower(trim(n.cattery)))) as cattery_gecontroleerd
  from public.nests n;

grant select on public.openbare_nesten to anon, authenticated;

create or replace view public.openbare_overzicht with (security_invoker = false) as
  select n.slug, n.moeder_naam, n.woonplaats, n.provincie,
         public.nestje_ras_openbaar(n.moeder_ras, n.stamboom, (n.stamboom is true and nullif(trim(n.stamboom_organisatie), '') is not null and nullif(trim(n.cattery), '') is not null and nullif(trim(n.vader_naam), '') is not null)) as moeder_ras,
         public.nestje_ras_openbaar(n.vader_ras, n.stamboom, (n.stamboom is true and nullif(trim(n.stamboom_organisatie), '') is not null and nullif(trim(n.cattery), '') is not null and nullif(trim(n.vader_naam), '') is not null)) as vader_ras,
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
           when n.stamboom is true and nullif(trim(n.stamboom_organisatie), '') is not null
                and nullif(trim(n.cattery), '') is not null and nullif(trim(n.vader_naam), '') is not null then 'fokker'
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
         ) as fotos,
         (n.moeder_stamboomnr is not null and n.vader_stamboomnr is not null
          and exists (select 1 from public.catteries_gecontroleerd g where g.owner_id = n.owner_id and lower(trim(g.cattery)) = lower(trim(n.cattery)))) as cattery_gecontroleerd
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


-- ─── Regel in de database: rasnaam alleen met Stamboom op Ja ───
create or replace function public.nestje_ras_regel()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  verkoper boolean := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') in ('authenticated', 'anon');
begin
  if verkoper and new.stamboom is not true
     and not (public.nestje_ras_vrij(new.moeder_ras) and public.nestje_ras_vrij(new.vader_ras)) then
    raise exception 'NESTJE: Een rasnaam mag alleen met stamboom. Kies “Huiskat”, “Kruising” of “Europese korthaar”, of zet Stamboom op Ja.';
  end if;
  return new;
end;
$$;

drop trigger if exists nestje_ras_regel on public.nests;
create trigger nestje_ras_regel
  before insert or update of moeder_ras, vader_ras, stamboom on public.nests
  for each row execute function public.nestje_ras_regel();
