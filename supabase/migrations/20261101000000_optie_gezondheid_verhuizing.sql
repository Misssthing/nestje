-- Nestje, uitbreiding 10: status "optie" en gezondheidsvinkjes "bij verhuizing"

-- 1. Nieuwe status: optie (tussen vrij en gereserveerd)
alter table public.kittens drop constraint if exists kittens_status_check;
alter table public.kittens
  add constraint kittens_status_check check (status in ('vrij', 'optie', 'gereserveerd', 'verhuisd'));

-- 2. Per nestje kiezen of de vinkjes nu al gelden of bij verhuizing
alter table public.nests
  add column if not exists gezondheid_bij_verhuizing boolean not null default false;

create or replace view public.openbare_nesten with (security_invoker = false) as
  select id, slug, moeder_naam, woonplaats, geboortedatum,
         verhuisleeftijd_weken, prijs, over_moeder,
         (whatsapp_nummer is not null) as heeft_whatsapp,
         vader_naam, over_vader,
         moeder_ras, vader_ras,
         stamboom, ouders_getest, ouders_test_info,
         moeder_gewicht, vader_gewicht, moeder_foto, vader_foto,
         afgerond, gezondheid_bij_verhuizing
  from public.nests;

grant select on public.openbare_nesten to anon, authenticated;

-- 3. Kopers mogen ook naar een kitten onder optie vragen (bijvoorbeeld als reserve)
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
    and k.status in ('vrij', 'optie')
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
