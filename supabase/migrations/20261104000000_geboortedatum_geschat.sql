-- Nestje, uitbreiding 13: geboortedatum kan een schatting zijn (bijvoorbeeld bij een vondelingennestje)
alter table public.nests
  add column if not exists geboortedatum_geschat boolean not null default false;

create or replace view public.openbare_nesten with (security_invoker = false) as
  select id, slug, moeder_naam, woonplaats, geboortedatum,
         verhuisleeftijd_weken, prijs, over_moeder,
         (whatsapp_nummer is not null) as heeft_whatsapp,
         vader_naam, over_vader,
         moeder_ras, vader_ras,
         stamboom, ouders_getest, ouders_test_info,
         moeder_gewicht, vader_gewicht, moeder_foto, vader_foto,
         afgerond, gezondheid_bij_verhuizing, geboortedatum_geschat
  from public.nests;

grant select on public.openbare_nesten to anon, authenticated;
