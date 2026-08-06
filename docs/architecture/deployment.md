# Despliegue a producción — moto-hertz-platform (motoshertz.com)

> Fase 7 revisada (`docs/phases/07-despliegue-produccion.md`, revisión 2026-08-05/06). El droplet de DigitalOcean existente (`motos-isolated-server`, Ubuntu 20.04.6 LTS) corre los 3 paquetes **nativos**, gestionados con **PM2**, detrás del **nginx** que ya sirve `motoshotwheels.com` en el mismo servidor. Docker queda solo para desarrollo local, con una única excepción en producción: PostgreSQL 17 (ver «Requisitos del droplet»).
>
> **El TLS de `motoshertz.com` no es certbot** — a diferencia de `motoshotwheels.com`, este dominio pasa por **Cloudflare** (DNS + proxy activo, decisión del usuario para tener caché/WAF). El certificado del origen lo emite Cloudflare (Origin CA), no Let's Encrypt.

## Arquitectura

```
Internet
  → Cloudflare (proxy activo, TLS del visitante, caché/WAF) — motoshertz.com y subdominios
      → nginx del droplet (puerto 443, Origin CA cert de Cloudflare, modo Full strict)
          → motoshertz.com / www.motoshertz.com   → localhost:3000  (web, PM2)
          → admin.motoshertz.com                  → localhost:3001  (cms-admin, PM2)
          → api.motoshertz.com                    → localhost:8080  (backend, PM2)
              → PostgreSQL 17 (Docker, localhost:5432 — única pieza no nativa, ver nota abajo)
              → Redis dedicado (nativo, localhost:6380, instalado: 8.0.6)
  → nginx del droplet (puerto 443, TLS con certbot — sin cambios) — motoshotwheels.com y subdominios
      → Apache 2.4 + PHP 8.4 + MySQL 8.0 (sin cambios)
          → Redis existente (localhost:6379, object cache de WordPress)
```

Todo corre en el mismo droplet, sin red de Docker (salvo el contenedor de Postgres): PM2 mantiene vivos los 3 procesos Node y los reinicia si se caen; el mismo nginx sirve los dos dominios, cada uno con su propio certificado — el de `motoshertz.com` lo valida Cloudflare, el de `motoshotwheels.com` lo renueva certbot como siempre.

## Requisitos del droplet

Todo lo de abajo está confirmado con `deploy/check-server.sh` (solo lectura) contra el droplet real.

- Ubuntu 20.04.6 LTS (focal) — ya estaba.
- nginx — ya estaba (sirve `motoshotwheels.com`).
- certbot 0.40.0 — ya estaba, activo (solo para `motoshotwheels.com` — `motoshertz.com` usa Cloudflare, ver arriba).
- ✅ Node.js 20.20.2 (vía nvm), pnpm 9.0.0 (corepack), PM2 7.0.3 — instalados con `deploy/install-server.sh` (2026-08-05).
- ✅ Docker 26.1.3 + imagen `postgres:17-alpine` descargada — instalado con `deploy/install-server.sh`. PostgreSQL corre **en Docker**, no nativo: PGDG no tiene build para focal/Ubuntu 20.04 (verificado 2026-08-05). Única excepción a "todo nativo" de este plan. Falta crear el contenedor de datos real con credenciales (ver «Primer deploy»).
- ✅ Redis 8.0.6 — instalado vía repo oficial (`packages.redis.io`); el apt de focal traía 5.0.7, quedó en **8.0.6** (la estable actual del repo, no una 7.x — mejor de lo planeado). Es un solo paquete del sistema: instalarlo actualizó también el Redis existente en 6379 (motoshotwheels.com) — evaluado como riesgo bajo (ver `docs/phases/07-despliegue-produccion.md`, es solo object cache de WordPress) y confirmado funcionando tras la actualización. El backend nuevo usa una instancia **dedicada en el puerto 6380**, separada de la de 6379.
- git 2.25.1 — ya estaba.
- ✅ DNS de `motoshertz.com` en Cloudflare, propagado — ver «Arquitectura» arriba.
- ✅ Certificado de Origin CA de Cloudflare, guardado en `/etc/ssl/cloudflare/motoshertz.com.pem` + `.key` (permisos `600`, verificado que la llave corresponde al certificado).

## Archivos relevantes

- `deploy/check-server.sh` — verificación de solo lectura contra el droplet (qué está y qué falta). Seguro de correr las veces que haga falta.
- `deploy/install-server.sh` (+ `deploy/run-remote.sh` para subirlo y correrlo por SSH) — provisiona el droplet, idempotente. Ya corrido 2026-08-05.
- `ecosystem.config.js` (PM2, raíz del repo) — pendiente de crear, define los 3 procesos y sus variables de entorno de producción.
- Configuración de nginx para `motoshertz.com` y subdominios — vive en el droplet (`/etc/nginx/sites-available/`), no versionada en el repo, igual que la config existente de `motoshotwheels.com`.
- `backend/migrations/` — SQL puro, se corre con `npm run migrate` dentro de `backend/` en el droplet.

**Artefactos que ya no aplican a este plan** (siguen en el repo, sin usarse en producción): `docker-compose.prod.yml`, `Caddyfile`, `backend/Dockerfile`, `web/Dockerfile`, `cms-admin/Dockerfile`, `.env.prod.example` (todavía con el dominio del template, `yamahaoriente.com` — el dominio real es `motoshertz.com`). Ver `docs/phases/07-despliegue-produccion.md` para el porqué del cambio de plan.

## Primer deploy (manual)

1. [x] En el droplet: instalar los requisitos (`deploy/install-server.sh`, ya corrido).
2. [ ] Clonar el repo, `pnpm install && pnpm build` (compila los 3 paquetes: `backend` con `tsc`, `web`/`cms-admin` con `next build`).
3. [ ] `docker run` del contenedor de Postgres (`postgres:17-alpine`, volumen nombrado, puerto `127.0.0.1:5432`, credenciales reales), completar el `.env` de `backend`, correr `npm run migrate` dentro de `backend/`.
4. [ ] Completar `ecosystem.config.js` con las variables de producción (`JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, URL del GraphQL, `REDIS_PORT=6380`, etc.) y `pm2 start ecosystem.config.js`.
5. [ ] `pm2 save` + `pm2 startup` para que los 3 procesos sobrevivan a un reinicio del droplet.
6. [ ] Agregar bloques `server` en nginx para `motoshertz.com`, `www.motoshertz.com`, `admin.motoshertz.com`, `api.motoshertz.com`, cada uno con `proxy_pass` a su puerto (`3000`/`3001`/`8080`) y `ssl_certificate`/`ssl_certificate_key` apuntando a `/etc/ssl/cloudflare/motoshertz.com.{pem,key}` — sin tocar los bloques existentes de `motoshotwheels.com`.
7. [x] DNS de `motoshertz.com` (y subdominios) apuntando al droplet — vía Cloudflare.
8. [ ] Poner Cloudflare en modo **Full (strict)** (SSL/TLS → Overview). No hay paso de certbot para este dominio — el certificado ya está generado (Origin CA), ver «Requisitos del droplet».
9. [ ] Smoke test: `web` carga el catálogo real, `cms-admin` permite login y un cambio ahí se refleja en `web` tras refrescar, y `motoshotwheels.com` sigue respondiendo sin cambios.

## Redeploys posteriores

```bash
git pull
pnpm install && pnpm build
pm2 reload ecosystem.config.js
```

Las migraciones nuevas de `backend` se corren a mano (`npm run migrate`) antes del reload si el cambio las requiere.

## Backups de Postgres

Ya no existe el servicio `postgres-backup` de Docker Compose (ese `docker-compose.prod.yml` quedó sin uso). **Pendiente de implementar**: con Postgres corriendo en un contenedor propio, la opción más simple es un cron diario con `docker exec <contenedor> pg_dump ...` (usa las herramientas de la propia imagen, sin depender de un `pg_dump` nativo con la versión correcta) y rotación manual, replicando el esquema 7 días / 4 semanas / 6 meses del servicio anterior. Sigue pendiente además decidir si los backups se replican fuera del droplet.

## Notas / limitaciones conocidas

- El droplet es punto único de falla para `motoshertz.com` (los 3 servicios nuevos + Postgres/Redis nuevos) y ya lo era para `motoshotwheels.com` — sin alta disponibilidad en ningún caso.
- `NEXT_PUBLIC_BACKEND_GRAPHQL_URL` (usada por `web` en el navegador) se fija en **build time** — cambiar `api.motoshertz.com` requiere un `pnpm build` nuevo de `web`, no solo un `pm2 reload`.
- CI/CD automático no está configurado todavía (decisión del usuario: deploy manual por ahora).
- El droplet ya existe, ya sirve `motoshotwheels.com`, y ya hay acceso SSH — pero el despliegue real de la app (clonar, build, migrar, `pm2 start`, nginx) **no se ha ejecutado todavía**, solo el provisionamiento de dependencias (`deploy/install-server.sh`) y el DNS/certificado. Falta la estrategia de secrets de producción antes de continuar (ver `docs/phases/07-despliegue-produccion.md`).
- `motoshotwheels.com` (WordPress/WooCommerce, Apache/PHP-FPM + MySQL) sigue activo indefinidamente en el mismo droplet — no se reemplaza ni se da de baja.
