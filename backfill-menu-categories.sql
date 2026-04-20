-- Backfill: importa in `categories` (type='menu') tutte le label già usate
-- in menu_items che non hanno una corrispondente categoria gestita.
-- Idempotente: la UNIQUE(type, slug) blocca i duplicati, INSERT OR IGNORE
-- gestisce il conflitto silenziosamente.
--
-- Slug semplificato: lowercase + spazi/underscore convertiti in trattini.
-- Per categorie con accenti o caratteri speciali può differire dallo slugify
-- JS (lib/categories), nel qual caso ne nasce un duplicato benigno: ricolloca
-- a mano da /admin/categorie.

INSERT OR IGNORE INTO categories (id, type, slug, label, color, sort_order)
SELECT
  lower(hex(randomblob(16))) AS id,
  'menu' AS type,
  lower(replace(replace(trim(category), ' ', '-'), '_', '-')) AS slug,
  trim(category) AS label,
  '' AS color,
  (rowid - 1) * 10 AS sort_order
FROM (
  SELECT DISTINCT category
  FROM menu_items
  WHERE category IS NOT NULL AND trim(category) != ''
);
