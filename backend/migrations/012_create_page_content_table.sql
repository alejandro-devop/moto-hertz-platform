-- UP
-- Pedido del usuario (ver `docs/cms-plan/MEJORAS.md`): un lugar donde el panel
-- administre el contenido editorial de una página del sitio (heading, caption,
-- etc.), empezando por `/motos`. Tabla genérica en vez de una columna nueva
-- por texto: `page` + `field` + `value`, así que agregar una página o un
-- campo editable no vuelve a pedir una migración — el código de
-- `web`/`cms-admin` es quien sabe qué campos tiene cada página.
--
-- Sin siembra inicial a propósito: si un campo nunca se guardó desde el
-- panel, no aparece en la tabla, y quien lo lee (`web`, el formulario del
-- panel) usa el mismo texto que hoy está quemado en el código como valor por
-- defecto — el sitio se ve igual hasta que alguien lo edite.

CREATE TABLE page_content (
  id UUID PRIMARY KEY,
  page VARCHAR(100) NOT NULL,
  field VARCHAR(100) NOT NULL,
  value TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_page_content_page_field ON page_content(page, field);

-- DOWN
DROP INDEX IF EXISTS idx_page_content_page_field;
DROP TABLE IF EXISTS page_content;
