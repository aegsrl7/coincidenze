-- COINCIDENZE — Migration 0001
-- Refactor multi-edizione: tabella editions + edition_id su events/accreditations/spuntino/editorial,
-- gallery e content unificati. Tabelle vecchie edizione0_*/edizione1_* lasciate in vita per backup;
-- una migration successiva potrà rimuoverle.

-- 1. editions
CREATE TABLE IF NOT EXISTS editions (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  year INTEGER NOT NULL,
  name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 0,
  accrediti_open INTEGER NOT NULL DEFAULT 0,
  spuntino_open INTEGER NOT NULL DEFAULT 0,
  hero_image_url TEXT NOT NULL DEFAULT '',
  hero_subtitle TEXT NOT NULL DEFAULT '',
  hero_location TEXT NOT NULL DEFAULT 'Marsam Locanda · Bene Vagienna',
  intro TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_editions_current ON editions(is_current);
CREATE INDEX IF NOT EXISTS idx_editions_slug ON editions(slug);
CREATE INDEX IF NOT EXISTS idx_editions_sort ON editions(sort_order);

INSERT OR IGNORE INTO editions (id, slug, year, name, event_date, is_current, accrediti_open, spuntino_open, hero_subtitle, sort_order)
VALUES
  ('ed-0', 'edizione-0', 2025, 'Edizione 0', '2025-04-25', 0, 0, 0, 'Sabato 25 aprile 2025', 0),
  ('ed-1', 'edizione-1', 2026, 'Edizione 1', '2026-04-25', 1, 0, 0, 'Sabato 25 aprile 2026', 1);

-- 2. edition_id su tabelle scoped + backfill ed-1
ALTER TABLE events ADD COLUMN edition_id TEXT REFERENCES editions(id);
UPDATE events SET edition_id = 'ed-1' WHERE edition_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_edition ON events(edition_id);

ALTER TABLE accreditations ADD COLUMN edition_id TEXT REFERENCES editions(id);
UPDATE accreditations SET edition_id = 'ed-1' WHERE edition_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_accreditations_edition ON accreditations(edition_id);

ALTER TABLE spuntino_bookings ADD COLUMN edition_id TEXT REFERENCES editions(id);
UPDATE spuntino_bookings SET edition_id = 'ed-1' WHERE edition_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_spuntino_edition ON spuntino_bookings(edition_id);

ALTER TABLE editorial_posts ADD COLUMN edition_id TEXT REFERENCES editions(id);
UPDATE editorial_posts SET edition_id = 'ed-1' WHERE edition_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_editorial_edition ON editorial_posts(edition_id);

-- 3. gallery unificata
CREATE TABLE IF NOT EXISTS editions_gallery (
  id TEXT PRIMARY KEY,
  edition_id TEXT NOT NULL REFERENCES editions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_editions_gallery_edition ON editions_gallery(edition_id, sort_order);

INSERT OR IGNORE INTO editions_gallery (id, edition_id, image_url, caption, sort_order, created_at, updated_at)
SELECT id, 'ed-0', image_url, caption, sort_order, created_at, updated_at FROM edizione0_gallery;

INSERT OR IGNORE INTO editions_gallery (id, edition_id, image_url, caption, sort_order, created_at, updated_at)
SELECT id, 'ed-1', image_url, caption, sort_order, created_at, updated_at FROM edizione1_gallery;

-- 4. content unificato
CREATE TABLE IF NOT EXISTS editions_content (
  id TEXT PRIMARY KEY,
  edition_id TEXT NOT NULL REFERENCES editions(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(edition_id, section)
);
CREATE INDEX IF NOT EXISTS idx_editions_content_edition ON editions_content(edition_id);

INSERT OR IGNORE INTO editions_content (id, edition_id, section, content, updated_at)
SELECT id, 'ed-0', section, content, updated_at FROM edizione0_content;

INSERT OR IGNORE INTO editions_content (id, edition_id, section, content, updated_at)
SELECT id, 'ed-1', section, content, updated_at FROM edizione1_content;

-- 5. Migrazione opzionale di spuntino_status (era stored in edizione1_content)
-- in editions.spuntino_open per ed-1. Nessuna riga = lascia il default 0.
UPDATE editions
SET spuntino_open = CASE
  WHEN (SELECT content FROM edizione1_content WHERE section = 'spuntino_status') = 'open' THEN 1
  ELSE 0
END
WHERE id = 'ed-1';
