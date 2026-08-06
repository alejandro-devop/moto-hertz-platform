#!/usr/bin/env bash
#
# Verifica (solo lectura, no instala ni cambia nada) si el droplet tiene lo
# necesario para el despliegue nativo de moto-hertz-platform. Ver
# docs/phases/07-despliegue-produccion.md para el detalle de cada requisito.
#
# Redis: el droplet ya tiene un Redis nativo en el puerto 6379 (usado por
# motoshotwheels.com) que install-server.sh actualiza al instalar el repo
# oficial (acordado con el usuario) — mismo binario para el 6379 existente y
# la instancia dedicada del backend en 6380. PostgreSQL 17 corre en Docker,
# no nativo: PGDG no tiene build para Ubuntu 20.04/focal.
#
# Uso:
#   ./deploy/check-server.sh                       # usa root@137.184.225.127:22
#   ./deploy/check-server.sh usuario@host [puerto]

set -uo pipefail

HOST="${1:-root@137.184.225.127}"
PORT="${2:-22}"
SSH_OPTS=(-p "$PORT" -o ConnectTimeout=10)

PASS=0
FAIL=0
WARN=0

ok()      { printf "  \033[32m✓\033[0m %s\n" "$1"; PASS=$((PASS + 1)); }
bad()     { printf "  \033[31m✗\033[0m %s\n" "$1"; FAIL=$((FAIL + 1)); }
warn()    { printf "  \033[33m!\033[0m %s\n" "$1"; WARN=$((WARN + 1)); }
section() { printf "\n\033[1m%s\033[0m\n" "$1"; }

# stdout/stderr del remoto se dejan pasar tal cual — cada llamada que solo
# necesita saber "existe sí/no" redirige explícitamente en el comando remoto.
remote()      { ssh "${SSH_OPTS[@]}" "$HOST" "$@"; }
remote_node() { ssh "${SSH_OPTS[@]}" "$HOST" "source \$HOME/.nvm/nvm.sh 2>/dev/null; $1"; }

echo "Conectando a $HOST:$PORT ..."
if ! remote true 2>/dev/null; then
  echo "No se pudo conectar por SSH. Revisa host/puerto/llave (o corre 'ssh-add' si tu llave pide passphrase)." >&2
  exit 1
fi
echo "Conexión OK."

# --- Sistema operativo -------------------------------------------------
section "Sistema operativo"
OS_PRETTY=$(remote "grep PRETTY_NAME /etc/os-release" 2>/dev/null)
if remote "grep -q 'VERSION_ID=\"20.04\"' /etc/os-release" 2>/dev/null; then
  ok "Ubuntu 20.04 (focal) — $OS_PRETTY"
else
  warn "No se detectó Ubuntu 20.04 — $OS_PRETTY (revisar si cambian los repos de apt a usar)"
fi

# --- Reverse proxy / TLS, ya deberían existir ---------------------------
section "Reverse proxy / TLS (ya deberían existir)"
if remote "command -v nginx" >/dev/null 2>&1; then
  ok "nginx instalado ($(remote 'nginx -v 2>&1'))"
  if remote "systemctl is-active --quiet nginx" 2>/dev/null; then
    ok "nginx activo"
  else
    warn "nginx instalado pero no aparece activo"
  fi
else
  bad "nginx NO encontrado"
fi

if remote "command -v certbot" >/dev/null 2>&1; then
  ok "certbot instalado ($(remote 'certbot --version 2>&1'))"
else
  bad "certbot NO encontrado"
fi

# --- Runtime de la app, por instalar ------------------------------------
section "Runtime de la app (por instalar)"

if remote "[ -s \$HOME/.nvm/nvm.sh ]" 2>/dev/null; then
  ok "nvm instalado"
else
  bad "nvm NO instalado"
fi

NODE_V=$(remote_node "node -v" 2>/dev/null)
if [[ "$NODE_V" == v20.* ]]; then
  ok "Node.js $NODE_V"
elif [[ -n "$NODE_V" ]]; then
  warn "Node.js encontrado pero es $NODE_V, no v20.x"
else
  bad "Node.js NO encontrado"
fi

PNPM_V=$(remote_node "pnpm -v" 2>/dev/null)
[[ -n "$PNPM_V" ]] && ok "pnpm $PNPM_V" || bad "pnpm NO instalado"

PM2_V=$(remote_node "pm2 -v" 2>/dev/null)
[[ -n "$PM2_V" ]] && ok "PM2 $PM2_V" || bad "PM2 NO instalado"

if remote "command -v git" >/dev/null 2>&1; then
  ok "git instalado ($(remote 'git --version'))"
else
  bad "git NO instalado"
fi

# --- Bases de datos ------------------------------------------------------
section "PostgreSQL 17 (Docker — PGDG no soporta focal)"

if remote "command -v docker" >/dev/null 2>&1; then
  ok "Docker instalado ($(remote 'docker --version'))"
  if remote "docker image inspect postgres:17-alpine" >/dev/null 2>&1; then
    ok "imagen postgres:17-alpine descargada"
  else
    bad "imagen postgres:17-alpine NO descargada"
  fi
  if remote "docker ps --format '{{.Names}}'" 2>/dev/null | grep -qi postgres; then
    ok "contenedor de Postgres corriendo: $(remote "docker ps --format '{{.Names}} ({{.Status}})'" | grep -i postgres)"
  else
    warn "ningún contenedor de Postgres corriendo todavía (falta el paso de deploy de la app)"
  fi
else
  bad "Docker NO instalado"
fi

section "Redis (existente en 6379 no se toca de puerto/datos; dedicado nuevo en 6380 para el backend)"

if [[ "$(remote 'redis-cli -p 6379 ping' 2>/dev/null)" == "PONG" ]]; then
  ok "Redis existente respondiendo en 6379 ($(remote 'redis-server --version' 2>/dev/null))"
else
  warn "No se detectó Redis respondiendo en 6379 (¿cambió desde el último check?)"
fi

if [[ "$(remote 'redis-cli -p 6380 ping' 2>/dev/null)" == "PONG" ]]; then
  REDIS_6380_V=$(remote "redis-cli -p 6380 info server" 2>/dev/null | grep redis_version)
  ok "Redis dedicado ya corriendo en 6380 ($REDIS_6380_V)"
else
  bad "Redis dedicado en 6380 NO instalado/corriendo todavía"
fi

# --- Qué hay ya sirviendo, para no chocar --------------------------------
section "Qué hay ya sirviendo en el droplet (para no chocar)"
echo "Puertos en escucha (80/443/3000/3001/8080/5432/6379/6380):"
remote "ss -tlnp | grep -E ':80 |:443 |:3000 |:3001 |:8080 |:5432 |:6379 |:6380 '" 2>/dev/null \
  | sed 's/^/    /'
[[ ${PIPESTATUS[0]} -ne 0 ]] && echo "    (sin coincidencias o sin datos)"

echo ""
echo "Stack del sitio existente (motoshotwheels.com):"
PHP_V=$(remote "php -v" 2>/dev/null | head -1)
[[ -n "$PHP_V" ]] && echo "    php: $PHP_V" || echo "    php: no encontrado en PATH"

if remote "command -v apache2" >/dev/null 2>&1; then
  echo "    apache2: $(remote 'apache2 -v 2>&1' | head -1)"
else
  echo "    apache2: no encontrado"
fi

DB_V=$(remote "mysql --version" 2>/dev/null)
[[ -z "$DB_V" ]] && DB_V=$(remote "mariadb --version" 2>/dev/null)
[[ -n "$DB_V" ]] && echo "    mysql/mariadb: $DB_V" || echo "    mysql/mariadb: no encontrado en PATH"

echo ""
echo "Certificados certbot ya emitidos:"
remote "certbot certificates" 2>/dev/null | grep -E 'Certificate Name|Domains' | sed 's/^/    /'

# --- Resumen --------------------------------------------------------------
section "Resumen"
echo "  OK: $PASS   Falta: $FAIL   Avisos: $WARN"
if [[ $FAIL -gt 0 ]]; then
  echo ""
  echo "  Hay $FAIL requisito(s) por instalar. Este script no instaló nada — solo verificó."
fi
