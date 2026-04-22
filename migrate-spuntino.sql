-- Crea tabella prenotazioni Spuntino delle 18.
-- Da lanciare una volta sola via:
--   wrangler d1 execute coincidenze-db --remote --file=migrate-spuntino.sql

CREATE TABLE IF NOT EXISTS spuntino_bookings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  seats INTEGER NOT NULL DEFAULT 1,
  notes TEXT DEFAULT '',
  consent_privacy INTEGER NOT NULL DEFAULT 0,
  email_sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
