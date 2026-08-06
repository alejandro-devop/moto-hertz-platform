#!/usr/bin/env bash
#
# Sube y corre un script de deploy/*.sh contra el droplet, vía stdin de SSH
# (no deja el archivo en el servidor).
#
# Uso: ./deploy/run-remote.sh <script.sh> [usuario@host] [puerto]

set -euo pipefail

SCRIPT="${1:?Uso: ./deploy/run-remote.sh <script.sh> [usuario@host] [puerto]}"
HOST="${2:-root@137.184.225.127}"
PORT="${3:-22}"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="$DIR/$SCRIPT"

if [[ ! -f "$SCRIPT_PATH" ]]; then
  echo "No existe $SCRIPT_PATH" >&2
  exit 1
fi

echo "Corriendo $SCRIPT en $HOST:$PORT ..."
ssh -p "$PORT" -o ConnectTimeout=10 "$HOST" 'bash -s' < "$SCRIPT_PATH"
