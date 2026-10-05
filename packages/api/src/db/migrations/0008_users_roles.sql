-- COINCIDENZE — Migration 0008
-- Utenti personali, ruoli e permessi: sostituiscono la password condivisa.
-- Dopo il deploy il primo amministratore si crea dalla pagina di login con la
-- password attuale (AUTH_SECRET). Applicare in produzione PRIMA del deploy del codice.

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  description TEXT NOT NULL DEFAULT '',
  permissions TEXT NOT NULL DEFAULT '[]',
  is_system INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  role_id TEXT NOT NULL REFERENCES roles(id),
  password_hash TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  session_version INTEGER NOT NULL DEFAULT 0,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK(purpose IN ('invite', 'reset')),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user ON user_tokens(user_id);

-- I tentativi di login, primo accesso e reset password hanno limiti separati
ALTER TABLE login_attempts ADD COLUMN kind TEXT NOT NULL DEFAULT 'login';
DROP INDEX IF EXISTS idx_login_attempts_ip_time;
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_kind_time ON login_attempts(ip, kind, failed_at);

-- Ruoli iniziali (modificabili dalla pagina Ruoli, tranne Amministratore)
INSERT OR IGNORE INTO roles (id, name, description, permissions, is_system, sort_order) VALUES
  ('role-admin', 'Amministratore', 'Tutti i permessi, compresa la gestione di utenti e ruoli. Non si modifica.', '[]', 1, 0),
  ('role-organizzazione', 'Organizzazione', 'Tutto tranne utenti, ruoli e impostazioni delle edizioni.', '["programma.view","programma.edit","programma.delete","artisti.view","artisti.edit","artisti.delete","media.view","media.edit","media.delete","editoriale.view","editoriale.edit","editoriale.delete","accrediti.view","accrediti.checkin","accrediti.delete","spuntino.view","spuntino.edit","spuntino.delete","menu.edit","categorie.edit","team.view","team.edit","note.view"]', 0, 1),
  ('role-agenzia', 'Agenzia', 'Agenzia social e marketing: programma, artisti, media e piano editoriale. Vede e modifica, non elimina, non vede le note interne.', '["programma.view","programma.edit","artisti.view","artisti.edit","media.view","media.edit","editoriale.view","editoriale.edit"]', 0, 2),
  ('role-checkin', 'Check-in', 'Scanner dei biglietti all''ingresso, per i volontari il giorno dell''evento.', '["accrediti.checkin"]', 0, 3);
