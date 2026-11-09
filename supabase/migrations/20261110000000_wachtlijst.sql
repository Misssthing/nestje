-- Nestje, uitbreiding 19: interesse- en wachtlijst.
--   * wachtlijst      = aanmeldingen voor één nestje (ook vóór de geboorte)
--   * wachtlijst_ras  = platformbrede raslijst (alleen nestjes met stamboomlabel), met e-mailbevestiging
-- Uitvoeren in Supabase → SQL Editor: alles plakken en één keer op Run drukken. Mag gerust vaker.
--
-- Kopers hebben geen account. Alles wat zij doen loopt via de server van Nestje (met de service-sleutel)
-- en een geheime link in hun mail. Daarom staan er voor kopers géén regels hieronder: zonder regel
-- kan niemand van buitenaf deze tabellen lezen of wijzigen.

-- ─────────────────────────────────────────────────────────────
-- 1. Aanmeldingen per nestje
-- ─────────────────────────────────────────────────────────────
create table if not exists public.wachtlijst (
  id                  uuid primary key default gen_random_uuid(),
  nest_id             uuid not null references public.nests(id) on delete cascade,
  naam                text not null check (char_length(naam) between 1 and 80),
  email               text not null check (char_length(email) between 5 and 200),
  woonplaats          text not null check (char_length(woonplaats) between 1 and 80),
  voorkeur_geslacht   text not null default 'geen' check (voorkeur_geslacht in ('kater', 'poes', 'geen')),
  voorkeur_vacht      text check (char_length(voorkeur_vacht) <= 80),
  motivatie           text check (char_length(motivatie) <= 1000),
  -- Blijft gelijk bij doorschuiven en bij weigeren: zo verliest niemand zijn plek.
  aangemeld_op        timestamptz not null default now(),
  status              text not null default 'wachtend'
                      check (status in ('wachtend', 'aangeboden', 'geaccepteerd', 'afgemeld', 'gesloten')),
  kitten_id           uuid references public.kittens(id) on delete set null,
  aanbod_verloopt_op  timestamptz,
  geweigerd_aantal    int not null default 0,
  token               uuid not null unique default gen_random_uuid(),
  via_ras_id          uuid,
  geboren_mail_op     timestamptz,
  gesloten_op         timestamptz,
  aangemaakt_op       timestamptz not null default now()
);

-- Eén actieve aanmelding per e-mailadres per nestje
create unique index if not exists wachtlijst_uniek_email
  on public.wachtlijst (nest_id, lower(email))
  where status in ('wachtend', 'aangeboden', 'geaccepteerd');

-- Eén openstaand aanbod per kitten
create unique index if not exists wachtlijst_een_aanbod_per_kitten
  on public.wachtlijst (kitten_id)
  where status = 'aangeboden';

create index if not exists wachtlijst_nest on public.wachtlijst (nest_id, status, aangemeld_op);

alter table public.wachtlijst enable row level security;

-- De verkoper mag de aanmeldingen voor zijn eigen nestjes lezen. Wijzigen gaat via de server.
drop policy if exists "eigenaar leest wachtlijst" on public.wachtlijst;
create policy "eigenaar leest wachtlijst" on public.wachtlijst
  for select to authenticated
  using (exists (select 1 from public.nests n where n.id = nest_id and n.owner_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 2. Platformbrede raslijst
-- ─────────────────────────────────────────────────────────────
create table if not exists public.wachtlijst_ras (
  id                  uuid primary key default gen_random_uuid(),
  ras                 text not null check (char_length(ras) between 2 and 60),
  naam                text not null check (char_length(naam) between 1 and 80),
  email               text not null check (char_length(email) between 5 and 200),
  woonplaats          text not null check (char_length(woonplaats) between 1 and 80),
  voorkeur_geslacht   text not null default 'geen' check (voorkeur_geslacht in ('kater', 'poes', 'geen')),
  voorkeur_vacht      text check (char_length(voorkeur_vacht) <= 80),
  motivatie           text check (char_length(motivatie) <= 1000),
  token               uuid not null unique default gen_random_uuid(),
  bevestigd_op        timestamptz,
  -- Na 12 maanden verloopt de aanmelding; een maand vooraf krijgt de koper een herinnering.
  geldig_tot          timestamptz not null default (now() + interval '12 months'),
  herinnerd_op        timestamptz,
  aangemaakt_op       timestamptz not null default now()
);

create unique index if not exists wachtlijst_ras_uniek on public.wachtlijst_ras (lower(ras), lower(email));

alter table public.wachtlijst_ras enable row level security;
-- Geen regels: verkopers zien de raslijst nooit. Alleen de server van Nestje leest en schrijft hier.

-- ─────────────────────────────────────────────────────────────
-- 3. Bijhouden welke mails per nestje al zijn verstuurd
-- ─────────────────────────────────────────────────────────────
alter table public.nests add column if not exists ras_mail_op timestamptz;
alter table public.nests add column if not exists vol_mail_op timestamptz;

-- Nestjes die al in het overzicht staan, krijgen geen raslijst-mail meer (die zijn niet nieuw).
update public.nests set ras_mail_op = now() where ras_mail_op is null and in_overzicht;
