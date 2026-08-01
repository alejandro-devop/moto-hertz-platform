-- UP
-- Pedido del usuario (ver `docs/cms-plan/MEJORAS.md`): la administración de
-- banners solo cubría el carrusel del home (`home_banners`); el resto de
-- banners del sitio —hoy solo el segundo banner ancho ("Financia tu próxima
-- Yamaha")— estaban quemados en `web/src/app/page.tsx`.
--
-- `slot` distingue en qué lugar del sitio va cada banner. Catálogo cerrado
-- (no texto libre como `service.category`): a diferencia de una categoría
-- meramente descriptiva, el valor de `slot` decide en qué componente de
-- `web` aparece el banner — un valor mal escrito lo dejaría sin renderizar
-- en ningún lado, así que lo controla el dominio (Zod + SDL), igual que
-- `service_points.type` (migración `007`).
--
-- Todos los banners existentes son del carrusel del home: se backfillean a
-- `HOME` con el propio DEFAULT de la columna.

ALTER TABLE home_banners ADD COLUMN slot VARCHAR(50) NOT NULL DEFAULT 'HOME';

-- El panel filtra y ordena por slot; el sitio público consulta un slot a la vez.
CREATE INDEX idx_home_banners_slot ON home_banners(slot) WHERE deleted_at IS NULL;

-- DOWN
DROP INDEX IF EXISTS idx_home_banners_slot;
ALTER TABLE home_banners DROP COLUMN slot;
