-- Telt hoe vaak kopers op "Vraag naar …" tikken.
-- Geen IP-adres, geen gegevens van de koper: alleen welk nestje, welk kitten en wanneer.

create table if not exists public.contact_kliks (
  id bigint generated always as identity primary key,
  nest_id uuid not null references public.nests(id) on delete cascade,
  kitten_id uuid references public.kittens(id) on delete set null,
  op timestamptz not null default now()
);

create index if not exists contact_kliks_nest_idx on public.contact_kliks (nest_id);

-- RLS aan zonder regels: niemand kan via de app lezen of schrijven.
-- Alleen de functie hieronder schrijft, en jij leest in de SQL Editor.
alter table public.contact_kliks enable row level security;

drop function if exists public.whatsapp_gegevens(text, uuid);

create function public.whatsapp_gegevens(p_slug text, p_kitten uuid)
returns table (nummer text, moeder_naam text, kitten_naam text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_nest uuid;
begin
  select n.id, n.whatsapp_nummer, n.moeder_naam, k.naam
    into v_nest, nummer, moeder_naam, kitten_naam
  from public.nests n
  join public.kittens k on k.nest_id = n.id
  where n.slug = p_slug
    and k.id = p_kitten
    and k.status = 'vrij'
    and n.whatsapp_nummer is not null;

  if v_nest is null then
    return;
  end if;

  insert into public.contact_kliks (nest_id, kitten_id) values (v_nest, p_kitten);
  return next;
end;
$$;

revoke execute on function public.whatsapp_gegevens(text, uuid) from public;
grant execute on function public.whatsapp_gegevens(text, uuid) to anon, authenticated;
