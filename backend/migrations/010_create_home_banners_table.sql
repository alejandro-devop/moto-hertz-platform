-- UP
-- Fase 5 del plan CMS (docs/cms-plan/phases/05-home-y-banners.md): el carrusel
-- de banners de la portada. Es la primera tabla nueva que crea el plan CMS —
-- `service_points`, `services` y `news` ya existían de la plantilla original;
-- `home_banners` no.
--
-- Alcance mínimo acordado con el usuario: solo el carrusel es administrable
-- desde el panel. El segundo banner ancho («Financia tu próxima Yamaha») y los
-- títulos de las secciones de la home quedan fijos en el código de `web`.

CREATE TABLE home_banners (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  image TEXT NOT NULL,
  image_mobile TEXT,
  link TEXT,
  link_label VARCHAR(100),
  -- El orden lo edita el panel (subir/bajar, o arrastrar): el carrusel del
  -- sitio lo respeta tal cual. Un banner nuevo se agrega al final.
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_home_banners_position ON home_banners(position);
CREATE INDEX idx_home_banners_activos ON home_banners(position) WHERE deleted_at IS NULL;

-- DOWN
DROP INDEX IF EXISTS idx_home_banners_activos;
DROP INDEX IF EXISTS idx_home_banners_position;
DROP TABLE IF EXISTS home_banners;
