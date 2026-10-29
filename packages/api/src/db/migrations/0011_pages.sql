-- COINCIDENZE — Migration 0011
-- Spunti: pagine e sottopagine per edizione, scritte da chi ha il permesso spunti.edit,
-- con etichette e commenti. Il testo è salvato come JSON dell'editor (mai HTML).
-- Applicare in produzione PRIMA del deploy del codice che la usa.

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  edition_id TEXT REFERENCES editions(id) ON DELETE SET NULL,
  parent_id TEXT REFERENCES pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL DEFAULT '',
  -- Testo semplice ricavato dall'editor: serve alla ricerca e alle anteprime
  content_text TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Sale a ogni salvataggio: chi salva una versione vecchia riceve 409 invece di sovrascrivere
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pages_edition ON pages(edition_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id);

CREATE TABLE IF NOT EXISTS page_comments (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_page_comments_page ON page_comments(page_id, created_at);

-- Permessi iniziali: Organizzazione vede, scrive e cancella; Agenzia vede e scrive.
-- Si aggiungono solo se il ruolo non li ha già (la migration si può rilanciare).
UPDATE roles SET permissions = json_insert(json_insert(json_insert(permissions, '$[#]', 'spunti.view'), '$[#]', 'spunti.edit'), '$[#]', 'spunti.delete'),
  updated_at = datetime('now')
  WHERE id = 'role-organizzazione' AND NOT EXISTS (SELECT 1 FROM json_each(roles.permissions) WHERE value = 'spunti.view');

UPDATE roles SET permissions = json_insert(json_insert(permissions, '$[#]', 'spunti.view'), '$[#]', 'spunti.edit'),
  updated_at = datetime('now')
  WHERE id = 'role-agenzia' AND NOT EXISTS (SELECT 1 FROM json_each(roles.permissions) WHERE value = 'spunti.view');
