-- Nestje, uitbreiding 17: links naar website, Facebook en Instagram op de profielpagina

alter table public.profielen
  add column if not exists website   text,
  add column if not exists facebook  text,
  add column if not exists instagram text;

alter table public.profielen drop constraint if exists profielen_website_check;
alter table public.profielen add constraint profielen_website_check
  check (website is null or (website ~* '^https?://[^\s]+\.[^\s]+$' and char_length(website) <= 200));

alter table public.profielen drop constraint if exists profielen_facebook_check;
alter table public.profielen add constraint profielen_facebook_check
  check (facebook is null or (facebook ~* '^https://(www\.|m\.|web\.)?(facebook|fb)\.com/[^\s]+$' and char_length(facebook) <= 200));

alter table public.profielen drop constraint if exists profielen_instagram_check;
alter table public.profielen add constraint profielen_instagram_check
  check (instagram is null or (instagram ~* '^https://(www\.)?instagram\.com/[^\s]+$' and char_length(instagram) <= 200));

create or replace view public.openbare_profielen with (security_invoker = false) as
  select slug, naam, intro, website, facebook, instagram
  from public.profielen
  where zichtbaar;

grant select on public.openbare_profielen to anon, authenticated;
