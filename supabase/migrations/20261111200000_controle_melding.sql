-- Nestje, uitbreiding 27: direct een mail aan de beheerder als een nestje klaarstaat voor controle.
-- Uitvoeren in Supabase → SQL Editor: alles plakken en één keer op Run drukken. Mag gerust vaker.

alter table public.nests add column if not exists controle_gemeld_op timestamptz;

-- Zelfde controle-regels als uitbreiding 26; verkopers kunnen ook het meldmoment niet wijzigen.
create or replace function public.nestje_controle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  verkoper boolean := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') in ('authenticated', 'anon');
begin
  if not verkoper then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.controle_status := 'wacht';
    new.controle_reden := null;
    new.gecontroleerd_op := null;
    new.ter_controle_op := now();
    new.controle_gemeld_op := null;
    return new;
  end if;

  new.controle_gemeld_op := old.controle_gemeld_op;

  if old.controle_status = 'aanpassen' and new.controle_status = 'wacht' then
    new.controle_reden := old.controle_reden;
    new.gecontroleerd_op := old.gecontroleerd_op;
    new.ter_controle_op := now();
    return new;
  end if;

  new.controle_status := old.controle_status;
  new.controle_reden := old.controle_reden;
  new.gecontroleerd_op := old.gecontroleerd_op;
  new.ter_controle_op := old.ter_controle_op;

  if (new.moeder_ras, new.vader_ras, new.stamboom, new.moeder_foto, new.soort,
      new.stamboom_organisatie, new.cattery, new.moeder_stamboomnr, new.vader_stamboomnr, new.vader_naam)
     is distinct from
     (old.moeder_ras, old.vader_ras, old.stamboom, old.moeder_foto, old.soort,
      old.stamboom_organisatie, old.cattery, old.moeder_stamboomnr, old.vader_stamboomnr, old.vader_naam)
  then
    new.controle_status := 'wacht';
    new.ter_controle_op := now();
  end if;
  return new;
end;
$$;
