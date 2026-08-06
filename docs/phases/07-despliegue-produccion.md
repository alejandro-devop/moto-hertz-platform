# Fase 7 — Despliegue a producción

## Objetivo

Desplegar los 3 paquetes (`web`, `backend`, `cms-admin`) a producción en el droplet de DigitalOcean ya existente (`motos-isolated-server`), corriendo **nativo** (sin Docker), gestionado con **PM2**, detrás del **nginx + certbot** que ya sirven `motoshotwheels.com` en ese mismo servidor.

## Decisión de arquitectura (revisión 2026-08-05, reemplaza el plan de Docker Compose + Caddy)

Esta fase pasó por dos cambios de rumbo:

1. El plan original (heredado de Fase 2) asumía `backend` en Cloud Run y `web`/`cms-admin` en Vercel o Cloud Run — revertido el 2026-07-07 a un solo droplet de DigitalOcean con Docker Compose.
2. **El plan de "todo en Docker Compose + Caddy" se revirtió a su vez el 2026-08-05**: el usuario prefiere administrar el droplet de forma nativa — Docker queda solo para desarrollo local (`backend/docker-compose.yml` + `Dockerfile.dev`, sin cambios). Motivo: el droplet ya tiene **nginx + certbot** resolviendo TLS para otro sitio, y añadir Caddy encima era una capa redundante; PM2 es más simple que mantener imágenes Docker de producción para 3 apps Node.

Además, el droplet **ya sirve `motoshotwheels.com`** (WordPress/WooCommerce vía Apache/PHP-FPM + MySQL, certs de certbot ya emitidos para ese dominio y sus subdominios). Ese sitio **no se reemplaza ni se da de baja** — sigue activo indefinidamente. `moto-hertz-platform` se despliega en un **dominio nuevo, `motoshertz.com`**, coexistiendo en el mismo servidor sin tocar el stack PHP existente.

Esto implica:

- `backend`, `web`, `cms-admin`: build nativo (`pnpm build` en cada paquete) y ejecución con **PM2** — no imágenes Docker en producción.
- Redis: instalado **nativo por apt** (repo oficial). PostgreSQL 17: **excepción, en Docker** — PGDG no soporta Ubuntu 20.04, ver «Requisitos del droplet».
- Reverse proxy: **nginx existente** en el droplet, con bloques `server` nuevos para los dominios de este proyecto — sin tocar la configuración de `motoshotwheels.com`.
- **TLS de `motoshertz.com`: Cloudflare, no certbot.** Decisión distinta a `motoshotwheels.com` — el dominio se compró en Namecheap pero el usuario lo pasó por **Cloudflare** (DNS + proxy activo, para caché/WAF), confirmado 2026-08-05. Con el proxy de Cloudflare activo, el navegador nunca ve el certificado del origen, así que en vez de Let's Encrypt/certbot se usa un **certificado de Origin CA de Cloudflare** en el nginx del droplet + modo **Full (strict)** en Cloudflare. `motoshotwheels.com` sigue con certbot normal, sin cambios — dominio, DNS y mecanismo de TLS completamente aparte.

## Dominio

**`motoshertz.com`**, registrado el 2026-08-05 en Namecheap. Mismo criterio de subdominios que el resto del monorepo:

| Paquete | Dominio | Puerto interno (PM2 → nginx) |
|---|---|---|
| `web` | `motoshertz.com` (+ `www.motoshertz.com`) | 3000 |
| `cms-admin` | `admin.motoshertz.com` | 3001 |
| `backend` (GraphQL) | `api.motoshertz.com` | 8080 |

**DNS ✅ (2026-08-05)**: nameservers movidos de Namecheap a Cloudflare (`ashley.ns.cloudflare.com` / `merlin.ns.cloudflare.com`), 4 registros A creados (`@`, `www`, `admin`, `api` → `137.184.225.127`), todos con proxy activo (nube naranja). Propagado y verificado con `dig` — los 4 resuelven a las IPs de borde de Cloudflare.

**TLS ✅ (2026-08-06)**: certificado de Origin CA generado en Cloudflare (SAN `motoshertz.com` + `*.motoshertz.com`, válido hasta 2041) y guardado en el droplet: `/etc/ssl/cloudflare/motoshertz.com.pem` + `.key` (permisos `600`), verificado que la llave corresponde al certificado. **Falta**: poner el modo **Full (strict)** en Cloudflare (SSL/TLS → Overview) y los bloques `server` de nginx que usan este certificado (paso 6 de «Pasos detallados»).

## Requisitos del droplet

Confirmado: **Ubuntu 20.04.6 LTS (focal)**, hostname `motos-isolated-server`. Ya sirve `motoshotwheels.com` — no tocar ese stack (Apache/PHP-FPM, MySQL, su config de nginx, sus certificados).

**Ya instalado, se reusa:**
- nginx
- certbot 0.40.0 (paquete de apt de focal)

**Instalado con `deploy/install-server.sh` (2026-08-05):**

| Herramienta | Motivo | Nota focal |
|---|---|---|
| ✅ Node.js 20 (v20.20.2) | runtime de los 3 paquetes | vía **nvm**, no el paquete de apt — permite fijar/actualizar la versión sin pelear con apt |
| ✅ pnpm 9.0.0 | gestor del monorepo (workspaces) | `corepack enable` (viene con Node 20) |
| ✅ PM2 7.0.3 | mantiene vivos `backend`/`web`/`cms-admin`, reinicio automático | falta `pm2 startup` + `pm2 save` (se hace junto con el primer `pm2 start`, paso 5) |
| ✅ Docker 26.1.3 + imagen `postgres:17-alpine` | motor para Postgres 17, **en Docker** | PGDG (`apt.postgresql.org`) **no tiene build para focal/Ubuntu 20.04** (verificado 2026-08-05: solo jammy/noble). Única excepción a "todo nativo". Docker vía `docker.io` de apt (no el repo oficial de Docker, para no repetir el mismo problema de soporte de focal). Falta crear el contenedor de datos real (paso 3). |
| ✅ Redis 8.0.6, instancia dedicada en **puerto 6380** | caché del backend nuevo | el apt de focal traía **5.0.7** (2019) — se instaló el repo oficial de Redis (`packages.redis.io`), que actualizó el paquete del sistema a **8.0.6** (la estable actual, no 7.x como se planeó originalmente — sin impacto en la decisión). Ver nota abajo sobre el Redis existente en 6379. |
| git | clonar/actualizar el repo | ya estaba (2.25.1, confirmado con `deploy/check-server.sh`) |

Verificación: `./deploy/check-server.sh` (solo lectura, confirma todo lo de arriba contra el droplet real).

**Nota sobre el Redis existente (puerto 6379, motoshotwheels.com).** `redis-server` es un solo paquete/binario del sistema en Ubuntu — instalar Redis 7.x del repo oficial actualiza ese binario para **las dos** instancias (la existente en 6379 y la nueva dedicada en 6380), aunque el 6379 mantiene su puerto, config y datos intactos. Se verificó (2026-08-05, `deploy/check-server.sh` + inspección manual) que ese Redis **solo sirve como object cache de WordPress/WooCommerce** vía el plugin *Redis Object Cache* v2.8.0 (`object-cache.php`), con 41.087 keys, todas prefijadas `vieja:wp:...` (consultas de posts/términos/productos, transients, caché de sesiones de WooCommerce) — nada es la fuente de verdad, las sesiones reales viven en MySQL. El plugin soporta oficialmente Redis hasta 7.x y degrada sin romper el sitio si Redis no responde un instante. Riesgo evaluado y aceptado por el usuario: unos segundos de reinicio del proceso durante la instalación, sin pérdida de datos relevante.

## Prerrequisitos

- Fases 0–6 completadas y validadas localmente.
- Droplet de DigitalOcean ya provisionado (`motos-isolated-server`), compartido con `motoshotwheels.com` — no se crea un droplet nuevo.
- ✅ Dominio `motoshertz.com` — registrado, DNS apuntando al droplet vía Cloudflare, certificado de origen generado.

## Decisiones pendientes a confirmar con el usuario antes de ejecutar el deploy real

- [x] ¿CI/CD desde ya o manual? → **Manual por ahora**, confirmado (2026-07-07).
- [x] ¿Docker o nativo en producción? → **Nativo con PM2**, confirmado (2026-08-05) — revierte la decisión anterior de Docker Compose + Caddy.
- [x] ¿Qué pasa con `motoshotwheels.com`? → **Se queda activo indefinidamente**, no se reemplaza ni se da de baja, confirmado (2026-08-05).
- [x] Dominio → **`motoshertz.com`**, confirmado (2026-08-05).
- [x] ¿Cómo instalar Redis 7.x sin afectar el 6379 existente? → **Se acepta actualizar el paquete del sistema** (no un binario aislado aparte), confirmado (2026-08-05) tras verificar que el 6379 solo es object cache de WordPress — ver nota en «Requisitos del droplet».
- [x] PGDG no soporta Ubuntu 20.04 para PostgreSQL 17 → **Postgres corre en Docker** (única excepción a "todo nativo"), confirmado (2026-08-05) sobre las otras dos alternativas (actualizar el droplet a 22.04, o usar Postgres 12) — ver «Requisitos del droplet».
- [x] ¿Cómo hacer TLS para `motoshertz.com`? → **Cloudflare (DNS + proxy + Origin CA)**, no certbot — el usuario quiso pasar el dominio por Cloudflare para caché/protección, confirmado 2026-08-05. Ver «Dominio» arriba.
- [x] El droplet ya existe y **sí se dio acceso SSH** (alias `motos` en `~/.aliases` del usuario: `root@137.184.225.127`) — usado para correr `deploy/check-server.sh` e `install-server.sh`.
- [ ] Estrategia de secrets en producción: por definir si es `.env` por paquete (leído por PM2 vía `ecosystem.config.js`) o algo más — suficiente para el tamaño actual del proyecto, sin gestor de secrets externo por ahora.

## Pasos detallados

1. [x] Instalar los requisitos del droplet: nvm + Node 20, pnpm, PM2, Docker + imagen `postgres:17-alpine`, Redis (repo oficial) — `deploy/install-server.sh`, corrido 2026-08-05.
2. [ ] Clonar el repo en el droplet, `pnpm install`, `pnpm build` (compila `backend`, `web`, `cms-admin`).
3. [ ] Crear el contenedor de Postgres con datos/credenciales reales (`docker run ... postgres:17-alpine`), completar el `.env` de `backend`, correr `npm run migrate` dentro de `backend/`.
4. [ ] Crear `ecosystem.config.js` (PM2) con los 3 procesos y sus variables de entorno de producción.
5. [ ] `pm2 start ecosystem.config.js` + `pm2 save` + `pm2 startup`.
6. [ ] Agregar bloques `server` en nginx para `motoshertz.com` / `www.motoshertz.com` / `admin.motoshertz.com` / `api.motoshertz.com`, reverse proxy a `localhost:3000`/`3001`/`8080`, usando el certificado ya generado (`/etc/ssl/cloudflare/motoshertz.com.pem` + `.key`) — sin tocar los bloques existentes de `motoshotwheels.com`.
7. [x] DNS de `motoshertz.com` (y subdominios) apuntando al droplet — vía Cloudflare, ver «Dominio».
8. [ ] Poner Cloudflare en modo **Full (strict)** (SSL/TLS → Overview) — recién ahí el tráfico real empieza a fluir por el certificado de origen. (Ya no aplica `certbot` para este dominio, ver «Decisión de arquitectura».)
9. [ ] Smoke test end-to-end (incluyendo que `motoshotwheels.com` siga respondiendo sin cambios).

Los pasos del plan anterior ("crear `Dockerfile` de producción para `web`/`cms-admin`", "crear `docker-compose.prod.yml`", "crear `Caddyfile`") ya no aplican a este flujo — esos artefactos quedan en el repo sin usarse en producción, ver «Riesgos / notas».

## Entregables

- `ecosystem.config.js` (PM2) en el repo — pendiente de crear.
- Configuración de nginx para los 4 subdominios de `motoshertz.com` — vive en el droplet, no versionada (igual que la config existente de `motoshotwheels.com`).
- Los 3 servicios corriendo nativos en el droplet, accesibles por HTTPS en `motoshertz.com` y subdominios.
- Documentación del proceso de deploy nativo (este documento + `docs/architecture/deployment.md`).

## Criterios de aceptación (DoD)

- [ ] Los 3 servicios responden en sus URLs de producción (HTTPS, `motoshertz.com` y subdominios).
- [ ] `motoshotwheels.com` sigue funcionando sin cambios.
- [ ] Un deploy puede repetirse de forma confiable (documentado o scriptado), sin pasos ad-hoc no documentados.
- [ ] Smoke test end-to-end pasa en producción.

## Riesgos / notas

- El droplet ya existe y ya sirve `motoshotwheels.com` — cualquier acción contra él (deploy real, cambios de nginx/DNS) requiere confirmación explícita del usuario antes de correrla, aunque ya hay acceso SSH.
- **Artefactos Docker de producción obsoletos para este plan**: `docker-compose.prod.yml`, `Caddyfile`, `backend/Dockerfile`, `web/Dockerfile`, `cms-admin/Dockerfile` (los dos últimos con `output: "standalone"`) y `.env.prod.example` (todavía con el dominio del template, `yamahaoriente.com`) siguen en el repo pero no se usan en este flujo. `backend/Dockerfile.dev` sí sigue vigente (desarrollo local).
- Backups de Postgres: con Postgres nativo (no contenedor) hay que definir el mecanismo — antes lo resolvía el servicio `postgres-backup` de Docker Compose. Pendiente: `pg_dump` por cron + rotación, o similar.
- Un solo droplet sigue siendo punto único de falla para los 3 servicios nuevos y para Postgres/Redis nuevos, igual que ya lo era para `motoshotwheels.com` — sin cambios respecto al riesgo ya conocido.
