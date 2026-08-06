#!/usr/bin/env bash
#
# Provisiona el droplet con las dependencias para moto-hertz-platform. Corre
# EN el servidor, como root — ver docs/phases/07-despliegue-produccion.md
# para el porqué de cada decisión. Idempotente: cada paso revisa si ya está
# hecho antes de actuar, es seguro volver a correrlo.
#
# No toca nginx, certbot, ni el sitio motoshotwheels.com — con dos
# excepciones conscientes y ya acordadas:
#  1. El paquete de Redis es único a nivel de sistema, así que instalar
#     Redis 7.x actualiza también el binario que sirve el Redis existente
#     en el puerto 6379 (mismo puerto/config/datos, solo cambia el motor).
#     Ver la nota "Redis existente" en docs/phases/07-despliegue-produccion.md.
#  2. PostgreSQL 17 corre en Docker, no nativo: apt.postgresql.org (PGDG) no
#     tiene build para Ubuntu 20.04/focal (verificado 2026-08-05). Es la
#     única pieza en Docker de todo este plan — el resto sigue nativo.
#
# Uso remoto (desde tu máquina, con el repo clonado):
#   ./deploy/run-remote.sh install-server.sh

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Este script tiene que correr como root." >&2
  exit 1
fi

log() { printf "\n\033[1m==> %s\033[0m\n" "$1"; }
ok()  { printf "  \033[32m✓\033[0m %s\n" "$1"; }

export DEBIAN_FRONTEND=noninteractive
CODENAME="$(lsb_release -cs)"

# Limpieza de un intento previo (PGDG no soporta focal, ver más abajo) que
# dejaba un repo roto y tumbaba cualquier apt update posterior.
rm -f /etc/apt/sources.list.d/pgdg.list /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc

log "apt update + paquetes base"
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg lsb-release build-essential >/dev/null
ok "paquetes base listos"

# --- Swap ----------------------------------------------------------------
# El droplet es de 1 core / ~2GB sin swap — de sobra para correr la app en
# reposo, pero un build de Next.js (o los 3 build a la vez) se queda sin
# memoria y el kernel mata el proceso (SIGKILL), no un error legible. 2GB de
# swap le da margen sin pretender ser RAM real.
log "Swap (2G)"
if swapon --show | grep -q .; then
  ok "ya había swap activo"
else
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
  ok "swap de 2G creado y activado"
fi

# --- nvm + Node 20 -----------------------------------------------------
log "nvm + Node.js 20"
export NVM_DIR="$HOME/.nvm"
if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  ok "nvm instalado"
else
  ok "nvm ya estaba instalado"
fi
# shellcheck disable=SC1091
\. "$NVM_DIR/nvm.sh"

if ! nvm ls 20 >/dev/null 2>&1; then
  nvm install 20
else
  ok "Node 20 ya estaba instalado"
fi
nvm alias default 20
ok "Node $(node -v) activo por defecto"

# --- pnpm (corepack) -----------------------------------------------------
log "pnpm"
corepack enable
corepack prepare pnpm@9.0.0 --activate
ok "pnpm $(pnpm -v)"

# --- PM2 -------------------------------------------------------------------
log "PM2"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2 >/dev/null
  ok "PM2 instalado"
else
  ok "PM2 ya estaba instalado"
fi
ok "PM2 $(pm2 -v)"

# --- PostgreSQL 17 (Docker — PGDG no soporta focal/20.04) ------------------
# apt.postgresql.org dejó de publicar builds para "focal" (verificado
# 2026-08-05: solo jammy/noble entre las de Ubuntu). Única excepción a "todo
# nativo": Postgres corre en un contenedor Docker, aislado del resto. El
# contenedor de datos real (con credenciales) se crea en el script de deploy
# de la app, no aquí — este paso solo deja el motor listo y la imagen
# descargada.
log "Docker (solo para Postgres 17 — PGDG no tiene build para Ubuntu 20.04/focal)"
if ! command -v docker >/dev/null 2>&1; then
  apt-get install -y -qq docker.io >/dev/null
  systemctl enable --now docker
  ok "Docker instalado ($(docker --version))"
else
  ok "Docker ya estaba instalado ($(docker --version))"
fi

log "Imagen postgres:17-alpine"
if ! docker image inspect postgres:17-alpine >/dev/null 2>&1; then
  docker pull -q postgres:17-alpine >/dev/null
  ok "imagen descargada"
else
  ok "imagen ya estaba descargada"
fi

# --- Redis 7.x (repo oficial) — actualiza el paquete del sistema -----------
log "Redis 7.x (actualiza el binario del sistema; el 6379 existente mantiene puerto/config/datos)"
REDIS_BEFORE="$(redis-server --version 2>/dev/null || echo 'no instalado')"
if redis-server --version 2>/dev/null | grep -qE 'v=7\.'; then
  ok "Redis ya estaba en 7.x"
else
  curl -fsSL https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb ${CODENAME} main" \
    >/etc/apt/sources.list.d/redis.list
  apt-get update -qq
  apt-get install -y -qq -o Dpkg::Options::="--force-confold" redis-server redis-tools >/dev/null
  ok "Redis actualizado: $REDIS_BEFORE -> $(redis-server --version)"
fi

# El paquete debería reiniciar el servicio existente solo; nos aseguramos.
if ! systemctl is-active --quiet redis-server; then
  systemctl restart redis-server
fi
if [[ "$(redis-cli -p 6379 ping 2>/dev/null)" == "PONG" ]]; then
  ok "Redis existente en 6379 respondiendo tras la actualización"
else
  echo "  AVISO: Redis en 6379 no respondió tras la actualización — revisar 'systemctl status redis-server'." >&2
fi

# --- Instancia dedicada de Redis en 6380 para el backend -------------------
log "Instancia dedicada de Redis en 6380 (backend)"
if [[ ! -f /etc/redis/redis-6380.conf ]]; then
  cp /etc/redis/redis.conf /etc/redis/redis-6380.conf
  sed -i \
    -e 's/^port .*/port 6380/' \
    -e 's/^pidfile .*/pidfile \/var\/run\/redis\/redis-server-6380.pid/' \
    -e 's/^logfile .*/logfile \/var\/log\/redis\/redis-server-6380.log/' \
    -e 's/^dir .*/dir \/var\/lib\/redis-6380/' \
    -e 's/^dbfilename .*/dbfilename dump-6380.rdb/' \
    /etc/redis/redis-6380.conf
  install -d -o redis -g redis -m 750 /var/lib/redis-6380
  ok "config de la instancia 6380 creada"
else
  ok "config de la instancia 6380 ya existía"
fi

if [[ -f /lib/systemd/system/redis-server@.service || -f /usr/lib/systemd/system/redis-server@.service ]]; then
  REDIS_6380_UNIT="redis-server@6380"
else
  # El paquete de packages.redis.io no siempre trae la unidad plantilla de
  # Debian (redis-server@.service) — se escribe una propia si falta.
  cat >/etc/systemd/system/redis-server-6380.service <<'UNIT'
[Unit]
Description=Redis dedicado (6380) para moto-hertz-platform backend
After=network.target

[Service]
Type=notify
ExecStart=/usr/bin/redis-server /etc/redis/redis-6380.conf
User=redis
Group=redis
RuntimeDirectory=redis-6380
RuntimeDirectoryMode=2755
Restart=always

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  REDIS_6380_UNIT="redis-server-6380"
fi

systemctl enable --now "$REDIS_6380_UNIT"
if [[ "$(redis-cli -p 6380 ping 2>/dev/null)" == "PONG" ]]; then
  ok "Redis dedicado respondiendo en 6380 ($REDIS_6380_UNIT)"
else
  echo "  AVISO: Redis en 6380 no respondió — revisar 'systemctl status $REDIS_6380_UNIT'." >&2
fi

# --- Resumen -----------------------------------------------------------
log "Resumen"
echo "  Node:              $(node -v)"
echo "  pnpm:               $(pnpm -v)"
echo "  PM2:                $(pm2 -v)"
echo "  Docker:             $(docker --version)"
echo "  postgres:17-alpine: $(docker image inspect -f '{{.RepoTags}} listo' postgres:17-alpine 2>/dev/null || echo 'FALTA')"
echo "  Redis 6379:         $(redis-cli -p 6379 ping 2>/dev/null || echo 'sin respuesta')"
echo "  Redis 6380:         $(redis-cli -p 6380 ping 2>/dev/null || echo 'sin respuesta')"
echo ""
echo "Listo. nginx, certbot y motoshotwheels.com no se tocaron más allá del binario de Redis."
echo "Falta: crear el contenedor de Postgres con datos/credenciales reales (script de deploy de la app)."
