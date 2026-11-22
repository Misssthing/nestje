-- Raslijst: meerdere rassen per aanmelding, plus "Alle rassen" (geen voorkeur).
-- Was: één rij per (ras, e-mailadres). Wordt: één rij per e-mailadres, met een lijst rassen.
-- Voer uit in Supabase → SQL Editor, NADAT de bijbehorende code live staat (anders verwacht de site
-- een kolom 'rassen' die er nog niet is).

alter table public.wachtlijst_ras add column if not exists rassen text[];
update public.wachtlijst_ras set rassen = array[ras] where rassen is null;
alter table public.wachtlijst_ras alter column rassen set not null;
alter table public.wachtlijst_ras drop constraint if exists wachtlijst_ras_rassen_check;
alter table public.wachtlijst_ras add constraint wachtlijst_ras_rassen_check
  check (array_length(rassen, 1) between 1 and 15);

drop index if exists public.wachtlijst_ras_uniek;
create unique index if not exists wachtlijst_ras_email_uniek on public.wachtlijst_ras (lower(email));

alter table public.wachtlijst_ras drop column if exists ras;
