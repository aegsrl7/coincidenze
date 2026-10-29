-- COINCIDENZE — Migration 0012
-- Spunti: commenti sul testo, come in Notion. Un commento "radice" può essere agganciato a un
-- pezzo di testo (citazione più un po' di contesto prima e dopo, per ritrovarlo anche se la pagina
-- cambia), ha risposte (parent_id) e si può segnare come risolto. Il testo della pagina non cambia:
-- per questo può commentare anche chi ha solo spunti.view.
-- Applicare in produzione PRIMA del deploy del codice che la usa.

ALTER TABLE page_comments ADD COLUMN parent_id TEXT REFERENCES page_comments(id) ON DELETE CASCADE;
ALTER TABLE page_comments ADD COLUMN anchor_quote TEXT;
ALTER TABLE page_comments ADD COLUMN anchor_prefix TEXT;
ALTER TABLE page_comments ADD COLUMN anchor_suffix TEXT;
ALTER TABLE page_comments ADD COLUMN resolved_at TEXT;
ALTER TABLE page_comments ADD COLUMN resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_page_comments_parent ON page_comments(parent_id);
