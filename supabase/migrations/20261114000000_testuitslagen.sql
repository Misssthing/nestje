-- Nestje, uitbreiding 38: testuitslagen met bewijs.
-- Per test kan de verkoper een foto of pdf van de uitslag uploaden en een registerlink (bijv. PawPeds) invullen.
-- Jij bekijkt de uitslag; daarna wordt het bestand verwijderd en blijft alleen "✓ Bekeken door Nestje" over.
-- Uitvoeren in Supabase → SQL Editor: alles plakken en één keer op Run drukken. Mag gerust vaker.

-- ─── 1. Afgeschermde opslag voor uitslagen (max 5 MB, foto of pdf) ───
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('testuitslagen', 'testuitslagen', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- Alleen de eigenaar van het nestje mag uploaden, bekijken en verwijderen (map = id van het nestje).
drop policy if exists "testuitslag uploaden door eigenaar" on storage.objects;
create policy "testuitslag uploaden door eigenaar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'testuitslagen'
    and exists (select 1 from public.nests n where n.id::text = (storage.foldername(name))[1] and n.owner_id = auth.uid())
  );

drop policy if exists "testuitslag bekijken door eigenaar" on storage.objects;
create policy "testuitslag bekijken door eigenaar" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'testuitslagen'
    and exists (select 1 from public.nests n where n.id::text = (storage.foldername(name))[1] and n.owner_id = auth.uid())
  );

drop policy if exists "testuitslag verwijderen door eigenaar" on storage.objects;
create policy "testuitslag verwijderen door eigenaar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'testuitslagen'
    and exists (select 1 from public.nests n where n.id::text = (storage.foldername(name))[1] and n.owner_id = auth.uid())
  );

-- ─── 2. Verkopers kunnen "bekeken" niet zelf zetten ───
-- Per test bewaren we: test, uitslag, datum, link, bewijs (pad), status (wacht/bekeken/afgekeurd), bekeken_op,
-- en beoordeeld (het pad van het bestand dat jij al hebt bekeken en dat daarna is verwijderd).
-- Regels als een verkoper opslaat:
--   - zelfde test, uitslag en datum als eerder → status, bekeken_op en bewijs blijven zoals ze waren,
--     tenzij hij echt een nieuw bestand uploadt → dan "wacht";
--   - nieuwe of gewijzigde test → met bestand "wacht", zonder bestand geen status.
create or replace function public.nestje_testen_schoon(nieuw jsonb, oud jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  e jsonb;
  o jsonb;
  nieuwbestand boolean;
  uit jsonb := '[]'::jsonb;
begin
  if nieuw is null or jsonb_typeof(nieuw) <> 'array' then
    return nieuw;
  end if;
  for e in select * from jsonb_array_elements(nieuw) loop
    o := null;
    select x into o
      from jsonb_array_elements(coalesce(oud, '[]'::jsonb)) x
     where x->>'test' is not distinct from e->>'test'
       and x->>'uitslag' is not distinct from e->>'uitslag'
       and x->>'datum' is not distinct from e->>'datum'
     limit 1;
    nieuwbestand := nullif(e->>'bewijs', '') is not null
      and (o is null or ((e->>'bewijs') is distinct from (o->>'bewijs') and (e->>'bewijs') is distinct from (o->>'beoordeeld')));
    e := (((e - 'status') - 'bekeken_op') - 'beoordeeld');
    if nieuwbestand then
      e := e || jsonb_build_object('status', 'wacht');
    elsif o is not null then
      e := (e - 'bewijs')
        || jsonb_strip_nulls(jsonb_build_object('bewijs', o->'bewijs', 'status', o->'status',
                                                'bekeken_op', o->'bekeken_op', 'beoordeeld', o->'beoordeeld'));
    else
      e := e - 'bewijs';
    end if;
    uit := uit || jsonb_build_array(e);
  end loop;
  return uit;
end;
$$;

create or replace function public.nestje_testen()
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
  new.moeder_testen := public.nestje_testen_schoon(new.moeder_testen, case when tg_op = 'UPDATE' then old.moeder_testen else null end);
  new.vader_testen  := public.nestje_testen_schoon(new.vader_testen,  case when tg_op = 'UPDATE' then old.vader_testen  else null end);
  return new;
end;
$$;

drop trigger if exists nestje_testen on public.nests;
create trigger nestje_testen
  before insert or update of moeder_testen, vader_testen on public.nests
  for each row execute function public.nestje_testen();
