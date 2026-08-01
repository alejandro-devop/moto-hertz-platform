-- UP
-- Pedido del usuario (ver `docs/cms-plan/MEJORAS.md`): `site_settings` no
-- tenía dónde guardar el logo del sitio — el que pinta
-- `web/src/components/menu/Menu.tsx` estaba quemado en un asset estático
-- (`/assets/logos/yamaha.svg`). `NULL` = seguir usando ese asset por defecto,
-- mismo criterio que el resto de campos opcionales de `site_settings`.

ALTER TABLE site_settings ADD COLUMN logo TEXT;

-- DOWN
ALTER TABLE site_settings DROP COLUMN logo;
