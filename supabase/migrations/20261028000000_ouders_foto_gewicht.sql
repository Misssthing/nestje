-- Nestje, uitbreiding 5: foto en gewicht van moeder en vader
-- Foto's staan in de bucket onder <nest_id>/ouders/<uuid>.jpg (valt onder de bestaande storage-policies)
alter table public.nests
  add column moeder_gewicht numeric(4,1) check (moeder_gewicht between 0.5 and 20),
  add column vader_gewicht  numeric(4,1) check (vader_gewicht between 0.5 and 20),
  add column moeder_foto    text,
  add column vader_foto     text;

create or replace view public.openbare_nesten with (security_invoker = false) as
  select id, slug, moeder_naam, woonplaats, geboortedatum,
         verhuisleeftijd_weken, prijs, over_moeder,
         (whatsapp_nummer is not null) as heeft_whatsapp,
         vader_naam, over_vader,
         moeder_ras, vader_ras,
         stamboom, ouders_getest, ouders_test_info,
         moeder_gewicht, vader_gewicht, moeder_foto, vader_foto
  from public.nests;

grant select on public.openbare_nesten to anon, authenticated;
