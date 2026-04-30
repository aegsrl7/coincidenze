-- FIX EVENTS: orari 10:30, titoli, categorie

-- Mostre: 10:00 → 10:30
UPDATE events SET start_time = '10:30' WHERE id = 'e5';
UPDATE events SET start_time = '10:30' WHERE id = 'e6';
UPDATE events SET start_time = '10:30' WHERE id = 'e7';

-- Cucina e Vino: 10:00 → 10:30
UPDATE events SET start_time = '10:30' WHERE id = '756263cb-5a42-4682-96a6-e975c9ea787a';
UPDATE events SET start_time = '10:30' WHERE id = '8af607fc-90a1-4616-b704-6de010c35e9f';

-- Michele Marziani primo libro: orario corretto 11:30
UPDATE events SET
  start_time = '11:30',
  end_time = '12:30',
  title = 'Michele Marziani - Lo Sciamano delle Alpi',
  description = 'Conduce Samantha Viva'
WHERE id = 'e1';

-- Michele Marziani secondo libro: titolo corretto
UPDATE events SET
  title = 'Michele Marziani - La cura dello stupore',
  description = 'Conduce Samantha Viva'
WHERE id = '5ef523af-13d7-4cef-8cfa-c8d7c5e613ca';

-- Pietro Fantone: titolo e descrizione
UPDATE events SET
  title = 'Pietro Fantone - Video AI',
  description = 'Ospite alla Berlinale, pluripremiato'
WHERE id = 'e3';

-- Petra Lindblom: categoria da teatro a sciamanesimo... usiamo teatro per ora ma fix titolo
UPDATE events SET
  title = 'Petra Lindblom - Viaggio sciamanico',
  description = 'Sciamana dalla Svezia'
WHERE id = '9710bec6-a42e-4fb7-83ec-054ce666d5d3';

-- Delfina Testa: titolo
UPDATE events SET
  title = 'Delfina Testa - Tarocchi',
  description = 'La cartomante della Gorra'
WHERE id = '98c1c898-c182-45d2-a2d5-b67676cd9ed7';

-- Cristina Saimandi: titolo
UPDATE events SET
  title = 'Cristina Saimandi - A Passo Lento',
  description = 'Cortometraggio dal Monviso'
WHERE id = '2243d5e6-766c-454c-aa7a-ce0dd142fd74';

-- FIX ARTISTS: categorie e bio

-- Cristina Saimandi: categoria scultura → video (per Ed.1 presenta il corto)
UPDATE artists SET
  category = 'video',
  bio = 'Scultrice e scalatrice, presenta il cortometraggio A Passo Lento'
WHERE id = 'a11';

-- Marco Fiaschi: categoria scultura → pittura (dal comunicato è pittore)
UPDATE artists SET
  category = 'pittura'
WHERE id = '0534cb42-5f31-45eb-a93e-345843f51892';

-- Serena Colombo: categoria cucina → grafica (piante e ricami, arte decorativa)
UPDATE artists SET
  category = 'grafica',
  bio = 'Opere realizzate con piante e ricami'
WHERE id = '759ebe50-ad42-4add-97d2-290fa5188f6e';

-- Pietro Fantone: bio aggiornata
UPDATE artists SET
  bio = 'Esperto di AI, ospite alla Berlinale, pluripremiato'
WHERE id = 'beecdbd1-9185-403d-b9dc-0249e12093f4';

-- CRUX: bio aggiornata
UPDATE artists SET
  bio = 'Sculture sul tema del volto umano'
WHERE id = 'a10';

-- Ancreus: bio
UPDATE artists SET
  bio = 'Alberto Calandri, Diego Cavallero, Giorgia Bruno'
WHERE id = 'a16';

-- Marco Marsam → Marco Salzotto (è lo chef E fotografo)
UPDATE artists SET
  name = 'Marco Salzotto',
  category = 'cucina',
  bio = 'Chef di Marsam Locanda e fotografo in mostra'
WHERE id = 'a15';

-- NUOVI ARTISTI mancanti
INSERT INTO artists (id, name, bio, category) VALUES
  ('alfonso-zorzo', 'Alfonso Zorzo', 'Collezione privata fotografica', 'fotografia');

INSERT INTO artists (id, name, bio, category) VALUES
  ('samantha-viva', 'Samantha Viva', 'Giornalista, conduce le presentazioni dei libri', 'scrittura');
