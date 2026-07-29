# Plan maestro — yamaha-oriente-platform

Monorepo (pnpm workspaces) con 3 paquetes:

- `web/` — sitio público de Yamaha Oriente. Plantilla: `../yamaha-motohertz` (Next.js 15 + React 19 + TS + Tailwind 4 + Sass + TanStack Query + Biome + PWA). Se toma todo excepto los assets.
- `backend/` — API GraphQL que alimenta a `web` y `cms-admin`. Plantilla: `../../xavi-platform/xavi-platform-node` (Node ≥18 + TS + Express 4 + Apollo Server 5 + PostgreSQL 17 + Drizzle + Redis + Zod + Jest), tanto en modo dev local (Docker Compose) como despliegue a producción en **Cloud Run** (contenedores).
- `cms-admin/` — headless CMS admin, sin plantilla previa. Se decide su arquitectura en la Fase 3.

## Decisiones ya confirmadas con el usuario

- Herramienta de monorepo: **pnpm workspaces** (sin Turborepo por ahora).
- ~~Target de despliegue del backend: Cloud Run (Docker)~~ — **revertido en Fase 7**: los 3 paquetes (`web`, `backend`, `cms-admin`) se despliegan juntos en un único **droplet de DigitalOcean**, vía Docker Compose (ver `docs/phases/07-despliegue-produccion.md`). No se usa GCP/Cloud Run ni Vercel.

## Fases

| # | Fase | Documento | Estado |
|---|------|-----------|--------|
| 0 | Fundación del monorepo | [00-fundacion-monorepo.md](phases/00-fundacion-monorepo.md) | pending |
| 1 | Migración de `web` | [01-migracion-web.md](phases/01-migracion-web.md) | pending |
| 2 | Migración de `backend` | [02-migracion-backend.md](phases/02-migracion-backend.md) | pending |
| 3 | Brainstorming `cms-admin` | [03-brainstorming-cms.md](phases/03-brainstorming-cms.md) | pending |
| 4 | Scaffold `cms-admin` | [04-scaffold-cms.md](phases/04-scaffold-cms.md) | pending |
| 5 | Integración end-to-end | [05-integracion-e2e.md](phases/05-integracion-e2e.md) | pending |
| 6 | Entorno de desarrollo local unificado | [06-dev-local-unificado.md](phases/06-dev-local-unificado.md) | pending |
| 7 | Despliegue a producción | [07-despliegue-produccion.md](phases/07-despliegue-produccion.md) | pending |
| 8 | QA y documentación final | [08-qa-y-cierre.md](phases/08-qa-y-cierre.md) | pending |

## Cómo se ejecuta

Este plan se ejecuta invocando la skill `yamaha-fase` (ver `.claude/skills/yamaha-fase/SKILL.md`). Cada invocación:

1. Lee `.claude/state/phase-state.json` para saber la fase actual.
2. Abre el documento de esa fase y ejecuta sus pasos.
3. Verifica los criterios de aceptación (Definition of Done) con el usuario.
4. Marca la fase como `completed` y avanza `current_phase` a la siguiente.

El estado es persistente entre sesiones — invocar la skill de nuevo continúa donde quedó, no repite fases completadas.
