-- Nestje, uitbreiding 32: label "Cattery gecontroleerd door Nestje".
-- Jij vinkt op de controlepagina "Cattery nagekeken" aan. Dat geldt voor die verkoper met die catterynaam,
-- dus ook voor volgende nestjes. Verandert de verkoper zijn catterynaam, dan vervalt het label.
-- Uitvoeren in Supabase → SQL Editor: alles plakken en één keer op Run drukken. Mag gerust vaker.

create table if not exists public.catteries_gecontroleerd (
  owner_id uuid primary key,
  cattery text not null,
  gecontroleerd_op timestamptz not null default now(),
  notitie text
);
alter table public.catteries_gecontroleerd enable row level security;
-- Geen regels: alleen de server van Nestje (beheerder) leest en schrijft hier.

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
         (n.moeder_stamboomnr is not null and n.vader_stamboomnr is not null) as stamboomnrs_bekend,
         exists (select 1 from public.catteries_gecontroleerd g where g.owner_id = n.owner_id and lower(trim(g.cattery)) = lower(trim(n.cattery))) as cattery_gecontroleerd
  from public.nests n;

grant select on public.openbare_nesten to anon, authenticated;

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
         ) as fotos,
         exists (select 1 from public.catteries_gecontroleerd g where g.owner_id = n.owner_id and lower(trim(g.cattery)) = lower(trim(n.cattery))) as cattery_gecontroleerd
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

create or replace view public.openbare_catteries with (security_invoker = false) as
with compleet as (
  select n.id, n.owner_id, n.cattery, n.stamboom_organisatie, n.provincie, n.woonplaats, n.moeder_ras, n.vader_ras,
         n.moeder_foto,
         row_number() over (partition by n.owner_id order by n.geboortedatum desc) as rn
  from public.nests n
  where n.stamboom is true
    and nullif(trim(n.stamboom_organisatie), '') is not null
    and nullif(trim(n.cattery), '') is not null
    and nullif(trim(n.vader_naam), '') is not null
    and n.controle_status = 'goedgekeurd'
    and not n.verborgen
)
select p.slug,
       p.naam,
       p.intro,
       p.sinds_jaar,
       p.rassen as rassen_tekst,
       p.vereniging,
       c.cattery,
       c.stamboom_organisatie as organisatie,
       c.provincie,
       c.woonplaats,
       (select array_agg(distinct q.r) from (
          select x.moeder_ras as r from compleet x where x.owner_id = p.owner_id
          union
          select x.vader_ras from compleet x where x.owner_id = p.owner_id
        ) q where q.r is not null) as rassen,
       coalesce(
         (select f.storage_path from public.nest_photos f where f.nest_id = c.id order by f.volgorde limit 1),
         c.moeder_foto
       ) as foto,
       (select count(*) from public.nests y
         where y.owner_id = p.owner_id and not y.afgerond and y.in_overzicht and y.controle_status = 'goedgekeurd')::int as lopend,
       (select min(z.aangemaakt_op) from public.nests z where z.owner_id = p.owner_id) as lid_sinds,
       exists (select 1 from public.catteries_gecontroleerd g
                where g.owner_id = p.owner_id and lower(trim(g.cattery)) = lower(trim(c.cattery))) as gecontroleerd
from public.profielen p
join compleet c on c.owner_id = p.owner_id and c.rn = 1
where p.zichtbaar;

grant select on public.openbare_catteries to anon, authenticated;
