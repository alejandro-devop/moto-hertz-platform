# Fase 0 — Fundación del monorepo

## Objetivo

Crear el esqueleto del monorepo `yamaha-oriente-platform` con pnpm workspaces, listo para alojar `web`, `backend` y `cms-admin`, sin aún migrar código de las plantillas.

## Prerrequisitos

- Ninguno (primera fase).

## Contexto / decisiones previas

- Gestor de paquetes: **pnpm workspaces** (confirmado con el usuario, sin Turborepo).
- **Decidido:** carpetas de primer nivel sin `packages/` intermedio (`web/`, `backend/`, `cms-admin/` en la raíz), ya que solo son 3 paquetes con roles muy distintos.
- **Decidido (paso 7):** sin linter compartido a nivel raíz. Cada paquete mantiene su propia configuración porque las plantillas de origen usan herramientas distintas: `web` (Biome, heredado de `yamaha-motohertz`), `backend` (ESLint + Prettier, heredado de `xavi-platform-node`), `cms-admin` (a definir en Fase 3/4).

## Pasos detallados

1. `git init` en `yamaha-oriente-platform/` (repo propio, independiente de `yamaha-motohertz` y `xavi-platform-node`).
2. Crear `pnpm-workspace.yaml` apuntando a `web`, `backend`, `cms-admin`.
3. Crear `package.json` raíz con:
   - `name: yamaha-oriente-platform`, `private: true`
   - scripts raíz útiles (`dev:web`, `dev:backend`, `dev:cms`, `lint`, etc. — pueden quedar como placeholders hasta que existan los paquetes)
4. Crear `.gitignore` raíz (node_modules, dist, .env, .next, coverage, etc. — basarse en los `.gitignore` de ambas plantillas).
5. Crear `README.md` raíz describiendo el monorepo y enlazando a `docs/PLAN.md`.
6. Crear carpetas vacías `web/`, `backend/`, `cms-admin/` con un `.gitkeep` o `README.md` mínimo cada una (se llenarán en fases 1, 2 y 4).
7. Configurar Biome (o el linter elegido) a nivel raíz si aplica a los 3 paquetes, o dejar que cada paquete tenga el suyo (decidir y anotar aquí).
8. Primer commit: "chore: scaffold monorepo".

## Entregables

- Repo git inicializado con estructura de carpetas.
- `pnpm-workspace.yaml`, `package.json` raíz, `.gitignore`, `README.md`.
- Carpetas `web/`, `backend/`, `cms-admin/` creadas (vacías o con stub).

## Criterios de aceptación (DoD)

- [ ] `pnpm install` corre sin errores en la raíz (aunque no haya paquetes con dependencias aún).
- [ ] `git log` muestra al menos un commit.
- [ ] Estructura de carpetas coincide con lo documentado en `docs/PLAN.md`.
- [ ] Usuario confirma que la convención de carpetas (sin `packages/` intermedio) es la deseada.

## Riesgos / notas

- Si el usuario quiere separar `web`/`backend`/`cms-admin` en repos independientes en vez de monorepo real, esta fase cambia radicalmente — confirmar antes de empezar si no quedó explícito.
