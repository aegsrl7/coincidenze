-- COINCIDENZE — Migration 0002
-- Scoping artists per edizione: edition_id su artists, backfill ed-1.

ALTER TABLE artists ADD COLUMN edition_id TEXT REFERENCES editions(id);
UPDATE artists SET edition_id = 'ed-1' WHERE edition_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_artists_edition ON artists(edition_id);
