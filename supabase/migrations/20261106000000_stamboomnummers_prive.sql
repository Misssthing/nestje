-- Nestje, uitbreiding 15: stamboomnummers niet meer openbaar (alleen voor de eigenaar en de beheerder)
drop view if exists public.openbare_nesten;

create view public.openbare_nesten with (security_invoker = false) as
  select id, slug, moeder_naam, woonplaats, geboortedatum,
         verhuisleeftijd_weken, prijs, over_moeder,
         (whatsapp_nummer is not null) as heeft_whatsapp,
         vader_naam, over_vader, moeder_ras, vader_ras,
         stamboom, ouders_getest, ouders_test_info,
         moeder_gewicht, vader_gewicht, moeder_foto, vader_foto,
         afgerond, gezondheid_bij_verhuizing, geboortedatum_geschat,
         soort, stamboom_organisatie, cattery,
         moeder_testen, vader_testen
  from public.nests;

grant select on public.openbare_nesten to anon, authenticated;
