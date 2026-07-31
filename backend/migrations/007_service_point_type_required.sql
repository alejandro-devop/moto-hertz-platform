-- UP
-- Fase 2 del plan CMS (docs/cms-plan/phases/02-puntos-de-atencion.md).
--
-- `type` deja de ser texto libre opcional y pasa a ser un catálogo cerrado
-- obligatorio (`SEDE`, `CONCESIONARIO`, `DISTRIBUIDOR`), porque es el filtro de
-- la lista del panel y la insignia de la tarjeta del sitio: un punto sin tipo
-- no se puede filtrar ni etiquetar.
--
-- El catálogo **no** se hace ENUM de Postgres a propósito: agregar un valor a
-- un ENUM es otra migración, y los valores los manda el dominio (validador Zod
-- + SDL), no la base. Aquí solo se exige que haya alguno.
--
-- No hay conversión de datos que hacer: la tabla está vacía cuando esto corre
-- (los 8 puntos del mock eran de plantilla y nunca se cargaron), pero el
-- UPDATE queda por si alguien alcanzó a insertar algo a mano.

UPDATE service_points SET type = 'SEDE' WHERE type IS NULL OR type = '';

ALTER TABLE service_points ALTER COLUMN type SET DEFAULT 'SEDE';
ALTER TABLE service_points ALTER COLUMN type SET NOT NULL;

-- La lista del panel filtra por tipo dentro de lo no borrado.
CREATE INDEX idx_service_points_type ON service_points(type) WHERE deleted_at IS NULL;

-- DOWN
DROP INDEX IF EXISTS idx_service_points_type;
ALTER TABLE service_points ALTER COLUMN type DROP NOT NULL;
ALTER TABLE service_points ALTER COLUMN type DROP DEFAULT;
