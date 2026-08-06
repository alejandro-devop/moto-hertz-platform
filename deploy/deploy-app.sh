#!/usr/bin/env bash
#
# Despliega la app (clona/actualiza, build, Postgres, migraciones, PM2) en el
# droplet. Corre EN el servidor, como root. Requiere que
# deploy/install-server.sh ya haya corrido, y que existan los archivos de
# secrets preparados en /opt/motoshertz/ (.env.production.pending,
# web.env.production.pending) — ver docs/architecture/deployment.md.
#
# Idempotente: seguro de volver a correr para actualizar (git pull + rebuild
# + pm2 reload). No toca nginx, certbot, ni motoshotwheels.com.
#
# Uso remoto (desde tu máquina, con el repo clonado):
#   ./deploy/run-remote.sh deploy-app.sh

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Este script tiene que correr como root." >&2
  exit 1
fi

log() { printf "\n\033[1m==> %s\033[0m\n" "$1"; }
ok()  { printf "  \033[32m✓\033[0m %s\n" "$1"; }

REPO_URL="https://github.com/alejandro-devop/moto-hertz-platform.git"
REPO_DIR="/opt/motoshertz/app"
STAGING="/opt/motoshertz"

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
\. "$NVM_DIR/nvm.sh"
nvm use default >/dev/null

# --- Código ---------------------------------------------------------------
log "Código (git clone / pull)"
if [[ -d "$REPO_DIR/.git" ]]; then
  git -C "$REPO_DIR" fetch origin
  git -C "$REPO_DIR" reset --hard origin/main
  ok "repo actualizado a $(git -C "$REPO_DIR" rev-parse --short HEAD)"
else
  git clone "$REPO_URL" "$REPO_DIR"
  ok "repo clonado en $REPO_DIR"
fi

# --- Secrets: mover de staging al checkout real (solo si no existen ya) ---
log "Archivos de secrets"
if [[ -f "$STAGING/.env.production.pending" && ! -f "$REPO_DIR/.env.production" ]]; then
  mv "$STAGING/.env.production.pending" "$REPO_DIR/.env.production"
  chmod 600 "$REPO_DIR/.env.production"
  ok ".env.production movido al repo"
elif [[ -f "$REPO_DIR/.env.production" ]]; then
  ok ".env.production ya existía en el repo (no se sobreescribió)"
else
  echo "  FALTA $REPO_DIR/.env.production — no se puede continuar." >&2
  exit 1
fi

if [[ -f "$STAGING/web.env.production.pending" && ! -f "$REPO_DIR/web/.env.production" ]]; then
  mv "$STAGING/web.env.production.pending" "$REPO_DIR/web/.env.production"
  chmod 600 "$REPO_DIR/web/.env.production"
  ok "web/.env.production movido al repo"
elif [[ -f "$REPO_DIR/web/.env.production" ]]; then
  ok "web/.env.production ya existía (no se sobreescribió)"
else
  echo "  FALTA $REPO_DIR/web/.env.production — no se puede continuar." >&2
  exit 1
fi

# --- Build ------------------------------------------------------------------
# Secuencial a propósito: "pnpm -r build" (el script "build" de la raíz)
# corre los 3 paquetes en paralelo, y en un droplet de 1 core / ~2GB sin
# margen eso mató el build de cms-admin por OOM (SIGKILL) la primera vez.
# Un solo core no gana nada paralelizando de todos modos.
log "pnpm install"
cd "$REPO_DIR"
pnpm install --frozen-lockfile
ok "dependencias instaladas"

log "Build secuencial: backend"
pnpm --filter ./backend build
ok "backend compilado"

log "Build secuencial: web"
pnpm --filter ./web build
ok "web compilado"

log "Build secuencial: cms-admin"
pnpm --filter ./cms-admin build
ok "cms-admin compilado"

# --- Postgres (Docker) ------------------------------------------------------
log "PostgreSQL (contenedor Docker)"
# Extracción segura: grep+cut, nunca 'source' del archivo (ADMIN_PASSWORD_HASH
# tiene '$' literales que bash interpretaría como variables si se sourcea).
DB_USER=$(grep '^DB_USER=' "$REPO_DIR/.env.production" | cut -d= -f2-)
DB_PASSWORD=$(grep '^DB_PASSWORD=' "$REPO_DIR/.env.production" | cut -d= -f2-)
DB_NAME=$(grep '^DB_NAME=' "$REPO_DIR/.env.production" | cut -d= -f2-)

if ! docker ps -a --format '{{.Names}}' | grep -qx motoshertz-postgres; then
  docker volume create motoshertz_pgdata >/dev/null
  docker run -d \
    --name motoshertz-postgres \
    --restart unless-stopped \
    -p 127.0.0.1:5432:5432 \
    -e POSTGRES_DB="$DB_NAME" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -v motoshertz_pgdata:/var/lib/postgresql/data \
    postgres:17-alpine >/dev/null
  ok "contenedor motoshertz-postgres creado"
elif ! docker ps --format '{{.Names}}' | grep -qx motoshertz-postgres; then
  docker start motoshertz-postgres >/dev/null
  ok "contenedor motoshertz-postgres estaba detenido, iniciado"
else
  ok "contenedor motoshertz-postgres ya estaba corriendo"
fi

log "Esperando a que Postgres acepte conexiones"
for i in $(seq 1 30); do
  if docker exec motoshertz-postgres pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    ok "Postgres listo"
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "  Postgres no respondió a tiempo — revisar 'docker logs motoshertz-postgres'." >&2
    exit 1
  fi
  sleep 1
done

# --- Migraciones -------------------------------------------------------------
log "Migraciones de backend"
(
  cd "$REPO_DIR/backend"
  export DB_HOST=localhost DB_PORT=5432 DB_USER DB_PASSWORD DB_NAME
  npm run migrate
)
ok "migraciones aplicadas"

# --- PM2 ----------------------------------------------------------------
log "PM2 (backend, web, cms-admin)"
cd "$REPO_DIR"
# 'pm2 start' sobre apps que ya existen por nombre las reinicia con la
# definición vieja en memoria de PM2, sin releer cambios de 'script'/'args'
# del ecosystem.config.js — hay que borrar y recrear en cada deploy.
pm2 delete ecosystem.config.js >/dev/null 2>&1 || true
pm2 start ecosystem.config.js
pm2 save
ok "PM2 corriendo y guardado (pm2 startup aparte, una sola vez por servidor)"

# --- Health check ---------------------------------------------------------
log "Verificando que los 3 procesos respondan (5s de margen para arrancar)"
sleep 5
HEALTH_FAIL=0
check_port() {
  local name=$1 url=$2
  shift 2
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "$url" "$@" 2>/dev/null || echo "000")
  if [[ "$code" == "200" ]]; then
    ok "$name responde (HTTP $code)"
  else
    echo "  AVISO: $name respondió HTTP $code — revisar 'pm2 logs $name'." >&2
    HEALTH_FAIL=1
  fi
}
check_port backend "http://localhost:8080/graphql" \
  -X POST -H "Content-Type: application/json" -d '{"query":"{__typename}"}'
check_port web "http://localhost:3000/"
check_port cms-admin "http://localhost:3001/login"
[[ $HEALTH_FAIL -eq 1 ]] && echo "  Al menos un proceso no respondió — no se marca como falla dura, pero revisar antes de tocar nginx." >&2

# --- Resumen -----------------------------------------------------------
log "Resumen"
pm2 list
echo ""
echo "Falta: bloques de nginx para motoshertz.com (usa el cert de Cloudflare ya"
echo "guardado en /etc/ssl/cloudflare/) y poner Cloudflare en modo Full (strict)."
