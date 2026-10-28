-- Nestje, uitbreiding 16: signaal als hetzelfde stamboomnummer van een moeder bij meerdere accounts opduikt.
-- Geen blokkade (een poes kan eerlijk van eigenaar wisselen), maar een lijstje voor de beheerder.
-- Vadernummers worden niet gesignaleerd: een dekkater dekt vaak bij meerdere catteries.

create table if not exists public.stamboom_signalen (
  id             bigint generated always as identity primary key,
  nest_id        uuid not null references public.nests (id) on delete cascade,
  ander_nest_id  uuid not null references public.nests (id) on delete cascade,
  stamboomnr     text not null,
  op             timestamptz not null default now(),
  bekeken        boolean not null default false,
  unique (nest_id, ander_nest_id)
);
alter table public.stamboom_signalen enable row level security;

create or replace function public.nestje_signaleer_stamboom()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  nummer text := lower(regexp_replace(coalesce(new.moeder_stamboomnr, ''), '[^a-zA-Z0-9]', '', 'g'));
begin
  if length(nummer) < 4 then
    return new;
  end if;
  insert into public.stamboom_signalen (nest_id, ander_nest_id, stamboomnr)
  select new.id, n.id, new.moeder_stamboomnr
  from public.nests n
  where n.owner_id <> new.owner_id
    and lower(regexp_replace(coalesce(n.moeder_stamboomnr, ''), '[^a-zA-Z0-9]', '', 'g')) = nummer
  on conflict (nest_id, ander_nest_id) do nothing;
  return new;
end;
$$;

drop trigger if exists nestje_stamboom_signaal on public.nests;
create trigger nestje_stamboom_signaal
  after insert or update of moeder_stamboomnr on public.nests
  for each row execute function public.nestje_signaleer_stamboom();
