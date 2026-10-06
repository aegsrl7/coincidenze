-- COINCIDENZE — Migration 0010
-- Riunioni organizzative: punti chiave, materiale preparatorio e trascrizione.
-- Visibili con il permesso riunioni.view (di default solo il ruolo Amministratore).
-- Applicare in produzione PRIMA del deploy del codice che la usa.

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  meeting_date TEXT NOT NULL,
  participants TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  prep_notes TEXT NOT NULL DEFAULT '',
  transcript TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
