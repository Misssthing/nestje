-- Nestje, uitbreiding 29: één regel voor "Fokker" en "met stamboom".
-- Stamboom op Ja + organisatie + catterynaam + naam van de vader = label "Fokker" én "met stamboom".
-- Ontbreekt er één, dan "Particulier" en geen stamboomlabel. Stamboomnummers blijven optioneel.
-- Uitvoeren in Supabase → SQL Editor: alles plakken en één keer op Run drukken.

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
