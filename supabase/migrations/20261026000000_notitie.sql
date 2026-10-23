-- Nestje, uitbreiding 3: privénotitie per kitten (alleen zichtbaar voor de verkoper).
-- Bewust NIET toegevoegd aan de view openbare_kittens.
alter table public.kittens
  add column notitie text check (char_length(notitie) <= 500);
