# Fase 6 — Entorno de desarrollo local unificado

## Objetivo

Permitir levantar los 3 paquetes (`web`, `backend`, `cms-admin`) juntos con un solo comando desde la raíz del monorepo.

## Prerrequisitos

- Fases 0–5 completadas.

## Pasos detallados

1. Extender `docker-compose.yml` (heredado de `backend` en Fase 2) para, opcionalmente, incluir `web` y `cms-admin` como servicios en modo dev, o mantenerlos corriendo vía pnpm fuera de Docker (decidir cuál es más simple para el flujo del usuario — recomendado: solo `backend` + postgres + redis + adminer en Docker, `web`/`cms-admin` con `pnpm dev` nativo, más rápido para hot-reload de Next.js).
2. Añadir scripts raíz en `package.json` (ej. `pnpm dev` que levante `docker-compose up -d` para backend y en paralelo `pnpm --filter web dev` + `pnpm --filter cms-admin dev` usando algo como `concurrently` o `npm-run-all`, sin necesidad de Turborepo).
3. Documentar en el `README.md` raíz el flujo: un solo comando (o 2-3 pasos claros) para tener todo el stack corriendo localmente.
4. Verificar variables de entorno consistentes entre paquetes (`.env.example` en cada uno, documentado).

## Entregables

- Script(s) raíz para levantar todo el stack en dev.
- `README.md` raíz actualizado con instrucciones de arranque.

## Criterios de aceptación (DoD)

- [ ] Un desarrollador nuevo puede clonar el repo, seguir el README, y tener los 3 servicios corriendo en menos de 10 minutos.
- [ ] No hay conflictos de puertos entre `web`, `cms-admin`, `backend`, `adminer`.

## Riesgos / notas

- Ninguno crítico; esta fase es principalmente de developer experience.
