-- COINCIDENZE — Migration 0003
-- Scoping menu_items e media_items per edizione.

ALTER TABLE menu_items ADD COLUMN edition_id TEXT REFERENCES editions(id);
UPDATE menu_items SET edition_id = 'ed-1' WHERE edition_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_edition ON menu_items(edition_id);

ALTER TABLE media_items ADD COLUMN edition_id TEXT REFERENCES editions(id);
UPDATE media_items SET edition_id = 'ed-1' WHERE edition_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_media_items_edition ON media_items(edition_id);
