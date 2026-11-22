-- Raslijst, uitbreiding: je kunt je voortaan voor meerdere rassen tegelijk aanmelden (in plaats van
-- één losse aanmelding per ras), en er komt een keuze "Alle rassen" voor wie geen voorkeur heeft en
-- een mail wil bij elk nieuw nestje met stamboom.
-- Voer uit in Supabase → SQL Editor: alles plakken en één keer op Run drukken. Mag gerust vaker.

alter table public.wachtlijst_ras add column if not exists rassen text[];
update public.wachtlijst_ras set rassen = array[ras] where rassen is null;
alter table public.wachtlijst_ras alter column rassen set not null;
alter table public.wachtlijst_ras drop constraint if exists wachtlijst_ras_rassen_check;
alter table public.wachtlijst_ras add constraint wachtlijst_ras_rassen_check
  check (array_length(rassen, 1) between 1 and 15);

drop index if exists public.wachtlijst_ras_uniek;
create unique index if not exists wachtlijst_ras_email_uniek on public.wachtlijst_ras (lower(email));

alter table public.wachtlijst_ras drop column if exists ras;
