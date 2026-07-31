-- UP
-- Fase 1 del plan CMS (docs/cms-plan/phases/01-medios.md): biblioteca de medios
-- y papelera.
--
-- Dos cosas en una sola migración porque son la misma decisión: si los archivos
-- se pueden recuperar, los registros de contenido también. `motorcycles` y
-- `media` estrenan el comportamiento completo (papelera, restaurar, eliminar
-- definitivamente); las otras tres tablas reciben solo la columna, porque
-- todavía no tienen capa de servicio ni GraphQL — sus fases (2, 3 y 4) la
-- encuentran ya puesta.

CREATE TABLE media (
  id UUID PRIMARY KEY,
  key VARCHAR(500) NOT NULL UNIQUE,
  url TEXT NOT NULL,
  driver VARCHAR(20) NOT NULL DEFAULT 'local',
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  original_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- La biblioteca se lista por fecha de subida, y casi siempre sin la papelera.
CREATE INDEX idx_media_created_at ON media(created_at DESC);
CREATE INDEX idx_media_activos ON media(created_at DESC) WHERE deleted_at IS NULL;

ALTER TABLE motorcycles ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE service_points ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE services ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE news ADD COLUMN deleted_at TIMESTAMP;

-- Índices parciales: toda lectura normal filtra por `deleted_at IS NULL`.
CREATE INDEX idx_motorcycles_activas ON motorcycles(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_points_activos ON service_points(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_services_activos ON services(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_news_activas ON news(created_at DESC) WHERE deleted_at IS NULL;

-- DOWN
DROP INDEX IF EXISTS idx_news_activas;
DROP INDEX IF EXISTS idx_services_activos;
DROP INDEX IF EXISTS idx_service_points_activos;
DROP INDEX IF EXISTS idx_motorcycles_activas;

ALTER TABLE news DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE services DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE service_points DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE motorcycles DROP COLUMN IF EXISTS deleted_at;

DROP INDEX IF EXISTS idx_media_activos;
DROP INDEX IF EXISTS idx_media_created_at;
DROP TABLE IF EXISTS media;
