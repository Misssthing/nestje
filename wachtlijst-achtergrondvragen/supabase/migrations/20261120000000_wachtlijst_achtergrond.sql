-- Nestje, uitbreiding 39: drie extra vragen bij aanmelden voor de wachtlijst (nest én raslijst).
-- Uitvoeren in Supabase → SQL Editor: alles plakken en één keer op Run drukken. Mag gerust vaker.
--
-- Geeft de verkoper vooraf een beter beeld van wie er op de wachtlijst staat: is er al een huisdier,
-- zijn er kinderen in huis, en is er al ervaring met katten. Alle drie zijn 'ja' of 'nee'.
-- Net als bij "motivatie" leggen we dit niet als verplicht vast in de database (bestaande aanmeldingen
-- hebben deze velden nog niet) — het formulier zelf dwingt een antwoord af bij nieuwe aanmeldingen.

alter table public.wachtlijst add column if not exists huisdier text check (huisdier in ('ja', 'nee'));
alter table public.wachtlijst add column if not exists kinderen text check (kinderen in ('ja', 'nee'));
alter table public.wachtlijst add column if not exists kat_ervaring text check (kat_ervaring in ('ja', 'nee'));

alter table public.wachtlijst_ras add column if not exists huisdier text check (huisdier in ('ja', 'nee'));
alter table public.wachtlijst_ras add column if not exists kinderen text check (kinderen in ('ja', 'nee'));
alter table public.wachtlijst_ras add column if not exists kat_ervaring text check (kat_ervaring in ('ja', 'nee'));
