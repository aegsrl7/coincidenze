-- COINCIDENZE — Migration 0007
-- Task scoped per edizione: edition_id su tasks, backfill ed-1.
-- Applicare in produzione PRIMA del deploy del codice che la usa.

ALTER TABLE tasks ADD COLUMN edition_id TEXT REFERENCES editions(id);
UPDATE tasks SET edition_id = 'ed-1' WHERE edition_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_edition ON tasks(edition_id);
