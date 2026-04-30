-- COINCIDENZE — Migration 0004
-- Tetto posti per "Lo spuntino delle 18", per edizione.

ALTER TABLE editions ADD COLUMN spuntino_capacity INTEGER NOT NULL DEFAULT 30;
