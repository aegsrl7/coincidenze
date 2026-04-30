-- COINCIDENZE — Migration 0006
-- Drop delle tabelle legacy edizione0_* e edizione1_*: i dati sono stati
-- migrati in editions_gallery / editions_content. Le route attive non le
-- referenziano da tempo. Eseguire SOLO dopo aver verificato che il merge
-- è andato a buon fine in produzione.

DROP TABLE IF EXISTS edizione0_gallery;
DROP TABLE IF EXISTS edizione0_content;
DROP TABLE IF EXISTS edizione1_gallery;
DROP TABLE IF EXISTS edizione1_content;
