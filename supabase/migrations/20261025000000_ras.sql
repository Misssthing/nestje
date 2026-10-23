-- Nestje, uitbreiding 2: ras van moeder en vader (optioneel)
alter table public.nests
  add column moeder_ras text check (char_length(moeder_ras) <= 60),
  add column vader_ras  text check (char_length(vader_ras) <= 60);

create or replace view public.openbare_nesten with (security_invoker = false) as
  select id, slug, moeder_naam, woonplaats, geboortedatum,
         verhuisleeftijd_weken, prijs, over_moeder,
         (whatsapp_nummer is not null) as heeft_whatsapp,
         vader_naam, over_vader,
         moeder_ras, vader_ras
  from public.nests;

grant select on public.openbare_nesten to anon, authenticated;
