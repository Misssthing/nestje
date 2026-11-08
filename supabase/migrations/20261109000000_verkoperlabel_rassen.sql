-- Nestje, uitbreiding 18: rasnamen netjes (BKH → Brits korthaar) en verkoperslabel Fokker/Particulier met "Lid sinds".
-- Uitvoeren in Supabase → SQL Editor: alles plakken en één keer op Run drukken. Mag gerust vaker.

-- ─────────────────────────────────────────────────────────────
-- 1. Rasnamen netjes maken
--    "bkh" → "Brits korthaar", "maine coon" → "Maine Coon",
--    "BKH x BLH" → "Brits korthaar × Brits langhaar". Onbekende namen blijven zoals ze zijn.
-- ─────────────────────────────────────────────────────────────
create or replace function public.nestje_ras_netjes(p_ras text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  aliassen constant jsonb := '{
    "bkh": "Brits korthaar", "britse korthaar": "Brits korthaar", "british shorthair": "Brits korthaar", "brits kort haar": "Brits korthaar",
    "blh": "Brits langhaar", "britse langhaar": "Brits langhaar", "british longhair": "Brits langhaar", "brits lang haar": "Brits langhaar",
    "mc": "Maine Coon", "mco": "Maine Coon", "mainecoon": "Maine Coon", "main coon": "Maine Coon", "maine coone": "Maine Coon",
    "nbk": "Noorse boskat", "nfo": "Noorse boskat", "noorse bos kat": "Noorse boskat", "norwegian forest cat": "Noorse boskat",
    "ekh": "Europese korthaar", "eur": "Europese korthaar", "europees korthaar": "Europese korthaar",
    "pers": "Perzisch", "perzer": "Perzisch", "perser": "Perzisch", "perzische kat": "Perzisch",
    "sib": "Siberische kat", "siberian": "Siberische kat", "siberische boskat": "Siberische kat", "siberiër": "Siberische kat",
    "ragdol": "Ragdoll", "bengal": "Bengaal", "bengaalse": "Bengaal", "birmaan": "Heilige Birmaan", "sacred birman": "Heilige Birmaan",
    "huis kat": "Huiskat", "gewone huiskat": "Huiskat", "russisch blauwe": "Russisch blauw", "okh": "Oosterse korthaar"
  }'::jsonb;
  rassen constant text[] := array[
    'Huiskat', 'Kruising', 'Europese korthaar', 'Brits korthaar', 'Brits langhaar', 'Maine Coon', 'Ragdoll',
    'Noorse boskat', 'Siberische kat', 'Bengaal', 'Perzisch', 'Exotic', 'Siamees', 'Oosterse korthaar',
    'Abessijn', 'Somali', 'Heilige Birmaan', 'Russisch blauw', 'Devon rex', 'Burmees',
    'Savannah', 'Cornish rex', 'Selkirk rex', 'Ocicat', 'Turkse angora', 'Turkse van', 'Neva Masquerade',
    'Tonkinees', 'Balinees', 'Oosterse langhaar', 'Chartreux', 'Korat', 'Egyptische mau', 'Burmilla',
    'Ragamuffin', 'Amerikaanse korthaar', 'Singapura', 'LaPerm'
  ];
  deel   text;
  netjes text;
  delen  text[] := '{}';
begin
  if p_ras is null or btrim(p_ras) = '' then
    return null;
  end if;
  foreach deel in array regexp_split_to_array(p_ras, '\s+(x|×|en)\s+|\s*[×/+&]\s*', 'i') loop
    deel := regexp_replace(btrim(deel), '\s+', ' ', 'g');
    continue when deel = '';
    netjes := coalesce(
      aliassen ->> lower(deel),
      (select r from unnest(rassen) as r where lower(r) = lower(deel) limit 1),
      deel
    );
    if not exists (select 1 from unnest(delen) as d where lower(d) = lower(netjes)) then
      delen := delen || netjes;
    end if;
  end loop;
  if cardinality(delen) = 0 then
    return null;
  end if;
  return left(array_to_string(delen, ' × '), 60);
end;
$$;

-- Bij opslaan automatisch netjes maken, ook als iemand de app omzeilt
create or replace function public.nestje_rasnaam_netjes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.moeder_ras := public.nestje_ras_netjes(new.moeder_ras);
  new.vader_ras  := public.nestje_ras_netjes(new.vader_ras);
  return new;
end;
$$;

drop trigger if exists nestje_rasnaam_netjes on public.nests;
create trigger nestje_rasnaam_netjes
  before insert or update of moeder_ras, vader_ras on public.nests
  for each row execute function public.nestje_rasnaam_netjes();

-- Bestaande nestjes één keer netjes maken (bijvoorbeeld "BKH" en "BLH")
update public.nests
   set moeder_ras = public.nestje_ras_netjes(moeder_ras),
       vader_ras  = public.nestje_ras_netjes(vader_ras)
 where moeder_ras is distinct from public.nestje_ras_netjes(moeder_ras)
    or vader_ras  is distinct from public.nestje_ras_netjes(vader_ras);

-- ─────────────────────────────────────────────────────────────
-- 2. Nestjespagina: "Lid sinds" (datum van het eerste nestje van deze verkoper)
--    Zelfde kolommen als voorheen, met lid_sinds aan het eind.
-- ─────────────────────────────────────────────────────────────
create or replace view public.openbare_nesten with (security_invoker = false) as
  select n.id, n.slug, n.moeder_naam, n.woonplaats, n.geboortedatum,
         n.verhuisleeftijd_weken, n.prijs, n.over_moeder,
         (n.whatsapp_nummer is not null) as heeft_whatsapp,
         n.vader_naam, n.over_vader, n.moeder_ras, n.vader_ras,
         n.stamboom, n.ouders_getest, n.ouders_test_info,
         n.moeder_gewicht, n.vader_gewicht, n.moeder_foto, n.vader_foto,
         n.afgerond, n.gezondheid_bij_verhuizing, n.geboortedatum_geschat,
         n.soort, n.stamboom_organisatie, n.cattery,
         n.moeder_testen, n.vader_testen,
         (select min(x.aangemaakt_op) from public.nests x where x.owner_id = n.owner_id) as lid_sinds
  from public.nests n;

grant select on public.openbare_nesten to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. Overzicht: label Fokker/Particulier en "Lid sinds"
--    Fokker = stamboom met catterynaam en stamboomorganisatie. Vondelingen krijgen geen label.
--    Zelfde voorwaarden als voorheen, met twee kolommen aan het eind.
-- ─────────────────────────────────────────────────────────────
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
         (select min(x.aangemaakt_op) from public.nests x where x.owner_id = n.owner_id) as lid_sinds
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
