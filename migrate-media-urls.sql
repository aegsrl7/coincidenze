-- Migra tutti gli URL media dal vecchio dominio workers.dev al custom domain
-- api.coincidenze.org. Idempotente: WHERE LIKE evita di ritoccare righe già migrate.
-- Da lanciare dopo il switch a custom_domain del Worker (vedi memoria deploy_flow).

UPDATE artists
SET image_url = REPLACE(image_url, 'https://coincidenze-api.lamaz7.workers.dev/', 'https://api.coincidenze.org/')
WHERE image_url LIKE 'https://coincidenze-api.lamaz7.workers.dev/%';

UPDATE media_items
SET url = REPLACE(url, 'https://coincidenze-api.lamaz7.workers.dev/', 'https://api.coincidenze.org/')
WHERE url LIKE 'https://coincidenze-api.lamaz7.workers.dev/%';

UPDATE media_items
SET thumbnail_url = REPLACE(thumbnail_url, 'https://coincidenze-api.lamaz7.workers.dev/', 'https://api.coincidenze.org/')
WHERE thumbnail_url LIKE 'https://coincidenze-api.lamaz7.workers.dev/%';

UPDATE edizione0_gallery
SET image_url = REPLACE(image_url, 'https://coincidenze-api.lamaz7.workers.dev/', 'https://api.coincidenze.org/')
WHERE image_url LIKE 'https://coincidenze-api.lamaz7.workers.dev/%';

UPDATE edizione1_gallery
SET image_url = REPLACE(image_url, 'https://coincidenze-api.lamaz7.workers.dev/', 'https://api.coincidenze.org/')
WHERE image_url LIKE 'https://coincidenze-api.lamaz7.workers.dev/%';

-- Le tabelle *_content hanno HTML libero che può includere URL embed
UPDATE edizione0_content
SET content = REPLACE(content, 'https://coincidenze-api.lamaz7.workers.dev/', 'https://api.coincidenze.org/')
WHERE content LIKE '%https://coincidenze-api.lamaz7.workers.dev/%';

UPDATE edizione1_content
SET content = REPLACE(content, 'https://coincidenze-api.lamaz7.workers.dev/', 'https://api.coincidenze.org/')
WHERE content LIKE '%https://coincidenze-api.lamaz7.workers.dev/%';
