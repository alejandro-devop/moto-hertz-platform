-- UP
-- Fase 3 del plan CMS (docs/cms-plan/phases/03-servicios.md).
--
-- `icon` nació como VARCHAR(10) porque la plantilla guardaba **emojis** ("🔧",
-- "⚙️"). El usuario decidió que los iconos salgan de `lucide-react`, así que lo
-- que se guarda ahora es el nombre del icono en kebab-case —`wrench`,
-- `shield-check`, `battery-charging`— y varios de esos nombres no caben en 10
-- caracteres. Sin este ensanche, guardar un servicio con icono falla con
-- «value too long for type character varying(10)».
--
-- El catálogo de iconos **no se valida en la base ni en el backend**: el
-- backend solo comprueba la forma (kebab-case, ≤ 60). Quién puede elegirse
-- vive en las dos capas de presentación (cms-admin/lib/service-icons.ts y
-- web/src/utils/service-icons.tsx), y un nombre desconocido cae en el icono por
-- defecto. Así, agregar un icono no obliga a desplegar el backend.
--
-- No hay conversión de datos que hacer: la tabla está vacía cuando esto corre
-- (los servicios del mock eran de plantilla y nunca se cargaron).

-- Es el único cambio de esta fase en la base: no hace falta índice nuevo para
-- filtrar por categoría (la migración 003 ya creó `idx_services_category`) ni
-- para la papelera (`idx_services_activos`, de la 006).

ALTER TABLE services ALTER COLUMN icon TYPE VARCHAR(60);

-- DOWN
ALTER TABLE services ALTER COLUMN icon TYPE VARCHAR(10);
