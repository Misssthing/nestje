-- Nestje, uitbreiding 4: stamboom, geteste ouders en gezondheid per kitten
alter table public.nests
  add column stamboom         boolean,
  add column ouders_getest    boolean,
  add column ouders_test_info text check (char_length(ouders_test_info) <= 120);

alter table public.kittens
  add column gechipt    boolean not null default false,
  add column enting1    boolean not null default false,
  add column enting2    boolean not null default false,
  add column ontwormd   boolean not null default false,
  add column ontvlooid  boolean not null default false,
  add column dierenarts boolean not null default false;

create or replace view public.openbare_nesten with (security_invoker = false) as
  select id, slug, moeder_naam, woonplaats, geboortedatum,
         verhuisleeftijd_weken, prijs, over_moeder,
         (whatsapp_nummer is not null) as heeft_whatsapp,
         vader_naam, over_vader,
         moeder_ras, vader_ras,
         stamboom, ouders_getest, ouders_test_info
  from public.nests;

create or replace view public.openbare_kittens with (security_invoker = false) as
  select id, nest_id, naam, geslacht, vacht, status, volgorde, omschrijving,
         gechipt, enting1, enting2, ontwormd, ontvlooid, dierenarts
  from public.kittens;

grant select on public.openbare_nesten, public.openbare_kittens to anon, authenticated;
