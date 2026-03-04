-- COINCIDENZE Seed Data (Edizione 0 - reference/demo)

-- Artisti
INSERT OR IGNORE INTO artists (id, name, bio, category) VALUES
  ('a1', 'Michele Marziani', 'Scrittore', 'scrittura'),
  ('a2', 'Beppe Rosso', 'Attore teatrale', 'teatro'),
  ('a3', 'Mauro Curti', 'Fotografo', 'fotografia'),
  ('a4', 'Luca Fumero', 'Fotografo', 'fotografia'),
  ('a5', 'Guido Harari', 'Fotografo', 'fotografia'),
  ('a6', 'Franco Fontana', 'Fotografo', 'fotografia'),
  ('a7', 'Gianni Del Bue', 'Pittore', 'pittura'),
  ('a8', 'Francesco Tabusso', 'Pittore', 'pittura'),
  ('a9', 'Marco Fiaschi', 'Scultore', 'scultura'),
  ('a10', 'Crux', 'Scultore', 'scultura'),
  ('a11', 'Cristina Saimandi', 'Scultrice', 'scultura'),
  ('a12', 'Theo Gallino', 'Scultore', 'scultura'),
  ('a13', 'Alice Petricore', 'Grafica', 'grafica'),
  ('a14', 'Romano Reviglio', '', 'scrittura');

-- Eventi (Edizione 0 reference)
INSERT OR IGNORE INTO events (id, title, description, date, start_time, end_time, location, category, artist_id) VALUES
  ('e1', 'Dove Dormi La Notte', 'Presentazione libro', '2026-04-25', '11:30', '12:30', 'Sala Principale', 'scrittura', 'a1'),
  ('e2', 'Il Bandito', 'Lettura e discussione', '2026-04-25', '17:30', '18:30', 'Sala Principale', 'scrittura', 'a1'),
  ('e3', 'I ventitre giorni della città di Alba', 'Performance teatrale', '2026-04-25', '15:30', '16:30', 'Teatro', 'teatro', 'a2'),
  ('e4', 'Il Gorgo', 'Performance teatrale', '2026-04-25', '18:30', '19:30', 'Teatro', 'teatro', 'a2'),
  ('e5', 'Mostra Fotografica', 'Esposizione collettiva', '2026-04-25', '10:00', '20:00', 'Galleria', 'fotografia', NULL),
  ('e6', 'Mostra Pittura', 'Esposizione collettiva', '2026-04-25', '10:00', '20:00', 'Sala Arte', 'pittura', NULL),
  ('e7', 'Mostra Scultura', 'Esposizione collettiva', '2026-04-25', '10:00', '20:00', 'Giardino', 'scultura', NULL);

-- Team membri esempio
INSERT OR IGNORE INTO team_members (id, name, role, email) VALUES
  ('tm1', 'Organizzatore 1', 'Direttore Artistico', ''),
  ('tm2', 'Organizzatore 2', 'Logistica', ''),
  ('tm3', 'Organizzatore 3', 'Comunicazione', '');

-- Task esempio
INSERT OR IGNORE INTO tasks (id, title, description, status, priority, assignee_id, category) VALUES
  ('t1', 'Confermare artisti', 'Contattare tutti gli artisti per conferma partecipazione', 'todo', 'high', 'tm1', 'scrittura'),
  ('t2', 'Allestimento sala principale', 'Predisporre sedie, tavoli, impianto audio', 'todo', 'high', 'tm2', NULL),
  ('t3', 'Preparare materiale comunicazione', 'Poster, flyer, social media', 'in_progress', 'medium', 'tm3', NULL),
  ('t4', 'Catering vino e cucina', 'Coordinare con Marsam per menu degustazione', 'todo', 'medium', 'tm2', 'cucina');
