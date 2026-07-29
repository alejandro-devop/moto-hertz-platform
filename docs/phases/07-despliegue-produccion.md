# Fase 7 — Despliegue a producción

## Objetivo

Desplegar los 3 paquetes (`web`, `backend`, `cms-admin`) a producción en un único **droplet de DigitalOcean**, corriendo todo vía Docker Compose (reutilizando como base el `docker-compose.yml` de `backend` de la Fase 6, extendido con los otros dos servicios).

## Decisión de arquitectura (reemplaza el plan original de Cloud Run/Vercel)

El plan original heredado de la Fase 2 asumía `backend` en Cloud Run y `web`/`cms-admin` en Vercel o Cloud Run. El usuario confirmó explícitamente cambiar de rumbo (Fase 7, sesión 2026-07-07): **todo el stack en un solo droplet de DigitalOcean**, autogestionado con Docker Compose. Motivo: simplicidad y costo — un solo servidor en vez de múltiples servicios administrados de GCP (Cloud Run + Cloud SQL + Redis administrado) o de Vercel.

Esto implica:
- `backend`: mismo `Dockerfile` de producción que ya existe (Fase 2), ahora corriendo en el droplet en vez de Cloud Run.
- `web` y `cms-admin`: necesitan `Dockerfile` propio (no existe todavía — hasta ahora solo se corrían nativos en dev). Next.js standalone output es el patrón recomendado para minimizar tamaño de imagen.
- Postgres y Redis: contenedores propios en el droplet (no administrados), con volúmenes persistentes — sin el costo de Cloud SQL/Redis administrado, a cambio de que backups/HA son responsabilidad manual.
- Reverse proxy con TLS: necesario para servir `web`, `cms-admin` y `backend` (GraphQL) en el mismo droplet bajo dominios/subdominios distintos con HTTPS. Candidatos: Caddy (TLS automático vía Let's Encrypt, config mínima) o Nginx + certbot. Recomendado: **Caddy** por simplicidad.

## Prerrequisitos

- Fases 0–6 completadas y validadas localmente.
- Droplet de DigitalOcean provisionado (o a provisionar en esta fase, con confirmación explícita del usuario antes de crear el recurso — tiene costo).
- Dominio(s) de Yamaha Oriente disponibles para apuntar los DNS al droplet.

## Decisiones pendientes a confirmar con el usuario antes de ejecutar el deploy real

- [x] ¿CI/CD desde ya o manual? → **Manual por ahora**, confirmado por el usuario (2026-07-07). CI/CD se evalúa después.
- [ ] El droplet ya existe (usuario lo confirmó), pero **no se ha dado acceso SSH todavía** — el usuario pidió explícitamente no desplegar aún.
- [ ] Dominio(s) a usar: el usuario confirmó que ya tiene un dominio, pero no dio el nombre real todavía.
- [ ] Estrategia de secrets en producción: por ahora `.env.prod` (no versionado) en el droplet, sin gestor de secrets externo — suficiente para el tamaño actual del proyecto, revisar si escala.

## Pasos detallados

1. ~~Crear `Dockerfile` de producción para `web` y `cms-admin`~~ ✅ hecho (`web/Dockerfile`, `cms-admin/Dockerfile`, ambos con `output: "standalone"`, verificados con build + run local).
2. ~~Crear `docker-compose.prod.yml`~~ ✅ hecho, incluye además `postgres-backup` (backups automáticos diarios con rotación, ver `docs/architecture/deployment.md`).
3. ~~Crear `Caddyfile`~~ ✅ hecho, dominios parametrizados por variable de entorno (`WEB_DOMAIN`/`CMS_DOMAIN`/`API_DOMAIN`).
4. ~~Documentar el proceso de deploy~~ ✅ hecho en `docs/architecture/deployment.md`. Todo lo anterior fue verificado corriendo el stack completo localmente (build + migraciones + arranque de los 7 servicios), sin tocar el droplet real.
5. Configurar variables de entorno de producción reales (`.env.prod` en el droplet) — **pendiente**, requiere secrets reales del usuario.
6. CI/CD — descartado por ahora (decisión del usuario).
7. Configurar DNS apuntando al droplet — **pendiente**, requiere el dominio real y acceso DNS del usuario.
8. Smoke test end-to-end en producción — **pendiente**, requiere que se ejecute el deploy real (bloqueado a propósito hasta que el usuario lo confirme).

## Entregables

- `docker-compose.prod.yml` + `Caddyfile` en el repo.
- `Dockerfile` de producción para `web` y `cms-admin`.
- Los 3 servicios corriendo en el droplet, accesibles por HTTPS en sus dominios.
- Documentación del proceso de deploy (manual o automatizado, según lo decidido).

## Criterios de aceptación (DoD)

- [ ] Los 3 servicios responden en sus URLs de producción (HTTPS, dominios propios).
- [ ] Un deploy puede repetirse de forma confiable (documentado o scriptado), sin pasos ad-hoc no documentados.
- [ ] Smoke test end-to-end pasa en producción.

## Riesgos / notas

- El droplet ya existe (no hay que crearlo/aprovisionarlo), pero cualquier acción contra él (deploy real, cambios de DNS) requiere confirmación explícita del usuario — no es una acción autónoma. El usuario pidió explícitamente no desplegar todavía.
- Backups de Postgres: resueltos con el servicio `postgres-backup` (dumps diarios, rotación 7d/4sem/6mes), verificado localmente que genera dumps reales. Sigue pendiente decidir si se replican fuera del droplet (ver `docs/architecture/deployment.md`).
- Un solo droplet es un único punto de falla para los 3 servicios y para Redis (sin backup, es solo caché) — aceptable para el tamaño actual del proyecto, documentado como limitación conocida.
