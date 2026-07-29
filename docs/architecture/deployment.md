# Despliegue a producción — yamaha-oriente-platform

> Fase 7 (`docs/phases/07-despliegue-produccion.md`). Un único droplet de DigitalOcean corre los 3 paquetes vía Docker Compose, con Caddy como reverse proxy y TLS automático (Let's Encrypt).

## Arquitectura

```
Internet
  → Caddy (puertos 80/443, TLS automático por dominio)
      → web:3000        (WEB_DOMAIN)
      → cms-admin:3001  (CMS_DOMAIN)
      → backend:8080    (API_DOMAIN, GraphQL)
          → postgres:5432
          → redis:6379
```

Todos los servicios corren en la misma red de Docker Compose del droplet (`docker-compose.prod.yml` en la raíz del repo); solo Caddy expone puertos al host.

## Archivos relevantes

- `docker-compose.prod.yml` — orquesta los 7 servicios (postgres, postgres-backup, redis, backend, web, cms-admin, caddy).
- `Caddyfile` — reverse proxy, un bloque por dominio, con TLS automático.
- `web/Dockerfile`, `cms-admin/Dockerfile`, `backend/Dockerfile` — imágenes de producción. `web`/`cms-admin` usan `output: "standalone"` de Next.js; el contexto de build es la raíz del repo (para resolver el pnpm workspace).
- `.env.prod.example` — variables esperadas en `.env.prod` (no versionado) en el droplet.

## Primer deploy (manual)

1. En el droplet: clonar el repo, copiar `.env.prod.example` a `.env.prod` y completar valores reales (contraseña de DB, `JWT_SECRET`, `ADMIN_PASSWORD_HASH`, dominios).
2. Apuntar los registros DNS de `WEB_DOMAIN`, `CMS_DOMAIN` y `API_DOMAIN` a la IP del droplet (A records). Caddy no emitirá certificados válidos hasta que el DNS resuelva.
3. `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build`
4. Verificar: `docker compose -f docker-compose.prod.yml logs -f backend` (migraciones deben correr solas al iniciar, ver `backend/scripts/docker-entrypoint.sh`).
5. Smoke test: `web` carga el catálogo real, `cms-admin` permite login y un cambio ahí se refleja en `web` tras refrescar.

## Redeploys posteriores

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Rebuildea solo las imágenes cuyo contexto cambió (Docker cachea capas). No hay downtime cero — hay un breve corte mientras el contenedor afectado se recrea.

## Backups de Postgres

El servicio `postgres-backup` (imagen `prodrigestivill/postgres-backup-local`) corre `pg_dump` diario contra `postgres` y guarda los dumps comprimidos en el volumen `postgres_backups`, con rotación automática (7 días / 4 semanas / 6 meses). Es un mínimo viable **local al droplet** — si el droplet completo se pierde (disco corrupto, borrado accidental), los backups se pierden con él. Pendiente de decidir con el usuario: copiar `postgres_backups` periódicamente a almacenamiento externo (ej. DigitalOcean Spaces, o `rsync` a otra máquina) para recuperación ante desastre real.

Restaurar un backup puntual:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres \
  psql -U "$DB_USER" -d "$DB_NAME" < /ruta/al/dump.sql
```
(los dumps quedan en el volumen `postgres_backups`, dentro del contenedor `postgres-backup` en `/backups/daily|weekly|monthly`).

## Notas / limitaciones conocidas

- Un solo droplet es punto único de falla para los 3 servicios y para Postgres/Redis (sin alta disponibilidad). Ver sección de Backups arriba para el estado de recuperación ante desastres.
- `NEXT_PUBLIC_BACKEND_GRAPHQL_URL` (usada por `web` en el navegador) se fija en **build time** vía `build.args` en `docker-compose.prod.yml` — cambiar `API_DOMAIN` requiere reconstruir la imagen de `web`, no solo reiniciar el contenedor.
- `ADMIN_PASSWORD_HASH` en `.env.prod` **debe** llevar cada `$` escapado como `$$` (ver comentario en `.env.prod.example`) — Docker Compose interpola `$` dentro de los archivos `.env` que carga con `--env-file`, igual que dentro del YAML, y un hash bcrypt sin escapar se trunca silenciosamente (sin error visible más que un warning genérico de "variable not set").
- CI/CD automático no está configurado todavía (decisión del usuario: deploy manual por ahora). Ver `docs/phases/07-despliegue-produccion.md` para el plan si se decide agregar GitHub Actions más adelante.
- El droplet de producción del usuario ya existe pero el despliegue real a él **no se ha ejecutado** — esta fase solo dejó listos los artefactos (Dockerfiles, compose, Caddyfile) y los verificó con builds locales. El deploy real requiere que el usuario decida el momento y provea acceso/dominio reales.
