-- Nestje, uitbreiding 12: verwachte nestjes (uitgerekende datum in de toekomst)

-- Interesse tonen in een verwacht nestje via WhatsApp (zonder kitten)
create or replace function public.whatsapp_interesse(p_slug text)
returns table (nummer text, moeder_naam text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_nest uuid;
begin
  select n.id, n.whatsapp_nummer, n.moeder_naam
    into v_nest, nummer, moeder_naam
  from public.nests n
  where n.slug = p_slug
    and n.geboortedatum > current_date
    and not n.afgerond
    and n.whatsapp_nummer is not null;

  if v_nest is null then
    return;
  end if;

  insert into public.contact_kliks (nest_id, kitten_id) values (v_nest, null);
  return next;
end;
$$;

revoke execute on function public.whatsapp_interesse(text) from public;
grant execute on function public.whatsapp_interesse(text) to anon, authenticated;

-- Overzicht: verwachte nestjes tellen ook mee (als de verkoper het overzicht aanzet)
create or replace view public.openbare_overzicht with (security_invoker = false) as
  select n.slug, n.moeder_naam, n.woonplaats, n.provincie,
         n.moeder_ras, n.vader_ras, n.stamboom,
         n.geboortedatum, n.verhuisleeftijd_weken, n.prijs, n.aangemaakt_op,
         (select count(*) from public.kittens k where k.nest_id = n.id)::int as kittens,
         (select count(*) from public.kittens k where k.nest_id = n.id and k.status = 'vrij')::int as vrij,
         (select count(*) from public.kittens k where k.nest_id = n.id and k.status = 'optie')::int as optie,
         coalesce(
           (select f.storage_path from public.nest_photos f where f.nest_id = n.id order by f.volgorde limit 1),
           (select kp.storage_path from public.kitten_photos kp
              join public.kittens k on k.id = kp.kitten_id
             where k.nest_id = n.id order by k.volgorde, kp.volgorde limit 1),
           n.moeder_foto
         ) as foto
  from public.nests n
  where n.in_overzicht
    and not n.verborgen
    and not n.afgerond
    and (
      n.geboortedatum > current_date
      or exists (select 1 from public.kittens k where k.nest_id = n.id and k.status in ('vrij', 'optie'))
    );

grant select on public.openbare_overzicht to anon, authenticated;
