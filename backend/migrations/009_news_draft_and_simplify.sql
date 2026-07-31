-- UP
-- Fase 4 del plan CMS (docs/cms-plan/phases/04-noticias.md).
--
-- (1) `published_at` nace `NOT NULL DEFAULT now()` en la plantilla: toda
-- noticia queda "publicada" el día que se crea y no hay forma de guardar un
-- borrador. La fase pide justo eso ("crea una noticia sin fecha de
-- publicación. Debe aparecer como borrador"), así que la columna pasa a ser
-- opcional y sin valor por defecto. La regla que lee el backend en adelante:
-- `published_at IS NULL` = borrador, en el futuro = programada, hoy o antes =
-- publicada. La vista pública (`news`/`newsList` sin sesión) excluye las dos
-- primeras; el panel las ve todas — ver `news.service.ts`.
--
-- (2) `author` pasa de `{ name, avatar }` a texto plano con el nombre. El
-- avatar de la plantilla apuntaba a rutas que nunca existieron
-- (`/assets/authors/carlos.jpg`), y no hay forma de subirlo desde el panel
-- hoy. Mismo criterio que se usó con `service-point` y `service`: no dejar en
-- el dominio una estructura que nadie va a poder llenar.
--
-- (3) `image` pasa de `{ main, thumbnail, alt }` a texto plano con la URL,
-- igual que `service.image`. El pipeline de medios de la Fase 1 ya entrega un
-- único WebP optimizado por foto; no genera una miniatura aparte, así que
-- `thumbnail` era un campo que el panel nunca iba a llenar de verdad.
--
-- La tabla está vacía cuando esto corre (nunca se sembraron las noticias del
-- mock), así que no hace falta convertir filas existentes con cuidado, pero
-- el `USING` de abajo sabe leer el `{name}` / `{main}` de la plantilla por si
-- alguna vez se aplica sobre datos reales.

ALTER TABLE news ALTER COLUMN published_at DROP DEFAULT;
ALTER TABLE news ALTER COLUMN published_at DROP NOT NULL;

ALTER TABLE news ALTER COLUMN author TYPE VARCHAR(255) USING (author->>'name');
ALTER TABLE news ALTER COLUMN image TYPE TEXT USING (image->>'main');

-- DOWN
ALTER TABLE news ALTER COLUMN image TYPE JSONB USING (
  CASE WHEN image IS NULL THEN NULL ELSE jsonb_build_object('main', image) END
);
ALTER TABLE news ALTER COLUMN author TYPE JSONB USING (
  CASE WHEN author IS NULL THEN NULL ELSE jsonb_build_object('name', author) END
);
ALTER TABLE news ALTER COLUMN published_at SET DEFAULT CURRENT_TIMESTAMP;
UPDATE news SET published_at = CURRENT_TIMESTAMP WHERE published_at IS NULL;
ALTER TABLE news ALTER COLUMN published_at SET NOT NULL;
