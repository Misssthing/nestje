-- Nestje, uitbreiding 6: meerdere nestjes per verkoper en nestjes afronden
drop index if exists public.nests_een_per_verkoper;
create index if not exists nests_owner_idx on public.nests (owner_id, aangemaakt_op desc);

alter table public.nests
  add column afgerond boolean not null default false;

create or replace view public.openbare_nesten with (security_invoker = false) as
  select id, slug, moeder_naam, woonplaats, geboortedatum,
         verhuisleeftijd_weken, prijs, over_moeder,
         (whatsapp_nummer is not null) as heeft_whatsapp,
         vader_naam, over_vader,
         moeder_ras, vader_ras,
         stamboom, ouders_getest, ouders_test_info,
         moeder_gewicht, vader_gewicht, moeder_foto, vader_foto,
         afgerond
  from public.nests;

grant select on public.openbare_nesten to anon, authenticated;
