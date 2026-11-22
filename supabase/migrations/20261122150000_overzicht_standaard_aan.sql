-- Nieuwe nestjes starten voortaan met "In het overzicht" al op Aan, in plaats van Uit.
-- Verandert niets aan bestaande nestjes, en niets aan de rest van de drempel: zonder moederfoto
-- en provincie komt een nestje nog steeds niet bij de controle, en zonder goedkeuring niet in
-- het overzicht. Dit bespaart de verkoper alleen de ene klik om het zelf aan te zetten.
-- Voer uit in Supabase → SQL Editor: alles plakken en op Run drukken.

alter table public.nests alter column in_overzicht set default true;
