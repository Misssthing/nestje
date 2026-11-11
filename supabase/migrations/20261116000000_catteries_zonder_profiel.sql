-- Nestje, uitbreiding 40: catteries ook zonder profielpagina op /catteries.
-- Een cattery komt op de lijst met een volledige, goedgekeurde stamboom en:
--   - een zichtbare profielpagina (kaartje linkt naar het profiel), of
--   - zonder (zichtbaar) profiel: een nestje dat in het overzicht staat (kaartje linkt naar dat nestje).
-- Gegevens uit een profiel dat uit staat (naam, intro enz.) worden niet getoond.
-- Uitvoeren in Supabase → SQL Editor: alles plakken en één keer op Run drukken. Mag gerust vaker.

drop view if exists public.openbare_catteries;

create view public.openbare_catteries with (security_invoker = false) as
with compleet as (
  select n.id, n.slug as nest_slug, n.owner_id, n.cattery, n.stamboom_organisatie, n.provincie, n.woonplaats,
         n.moeder_ras, n.vader_ras, n.moeder_foto, n.moeder_stamboomnr, n.vader_stamboomnr,
         row_number() over (
           partition by n.owner_id
           order by (n.in_overzicht and not n.afgerond) desc, n.geboortedatum desc
         ) as rn
  from public.nests n
  left join public.profielen p on p.owner_id = n.owner_id
  where n.stamboom is true
    and nullif(trim(n.stamboom_organisatie), '') is not null
    and nullif(trim(n.cattery), '') is not null
    and nullif(trim(n.vader_naam), '') is not null
    and n.controle_status = 'goedgekeurd'
    and not n.verborgen
    and (coalesce(p.zichtbaar, false) or (n.in_overzicht and not n.afgerond))
)
select case when coalesce(p.zichtbaar, false) then p.slug end as slug,
       case when coalesce(p.zichtbaar, false) then '/van/' || p.slug else '/n/' || c.nest_slug end as link,
       coalesce(p.zichtbaar, false) as profiel,
       case when p.zichtbaar then p.naam end as naam,
       case when p.zichtbaar then p.intro end as intro,
       case when p.zichtbaar then p.sinds_jaar end as sinds_jaar,
       case when p.zichtbaar then p.rassen end as rassen_tekst,
       case when p.zichtbaar then p.vereniging end as vereniging,
       c.cattery,
       c.stamboom_organisatie as organisatie,
       c.provincie,
       c.woonplaats,
       (select array_agg(distinct q.r) from (
          select x.moeder_ras as r from compleet x where x.owner_id = c.owner_id
          union
          select x.vader_ras from compleet x where x.owner_id = c.owner_id
        ) q where q.r is not null) as rassen,
       coalesce(
         (select f.storage_path from public.nest_photos f where f.nest_id = c.id order by f.volgorde limit 1),
         c.moeder_foto
       ) as foto,
       (select count(*) from public.nests y
         where y.owner_id = c.owner_id and not y.afgerond and y.in_overzicht and y.controle_status = 'goedgekeurd')::int as lopend,
       (select min(z.aangemaakt_op) from public.nests z where z.owner_id = c.owner_id) as lid_sinds,
       (c.moeder_stamboomnr is not null and c.vader_stamboomnr is not null
        and exists (select 1 from public.catteries_gecontroleerd g
                    where g.owner_id = c.owner_id and lower(trim(g.cattery)) = lower(trim(c.cattery)))) as gecontroleerd
from compleet c
left join public.profielen p on p.owner_id = c.owner_id
where c.rn = 1;

grant select on public.openbare_catteries to anon, authenticated;
