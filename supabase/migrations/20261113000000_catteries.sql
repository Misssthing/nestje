-- Nestje, uitbreiding 31: overzichtspagina met alle catteries (/catteries).
-- Een cattery staat erop als:
--   - de profielpagina aan staat (Over jou en je profielpagina > Profielpagina tonen: Aan), en
--   - minstens één nestje compleet is (Stamboom Ja + organisatie + catterynaam + naam vader) én door jou is goedgekeurd.
-- Ook afgeronde nestjes tellen mee, zodat een cattery blijft staan tussen twee nestjes in.
-- Uitvoeren in Supabase → SQL Editor: alles plakken en één keer op Run drukken. Mag gerust vaker.

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
       (select min(z.aangemaakt_op) from public.nests z where z.owner_id = p.owner_id) as lid_sinds
from public.profielen p
join compleet c on c.owner_id = p.owner_id and c.rn = 1
where p.zichtbaar;

grant select on public.openbare_catteries to anon, authenticated;
