# yamaha-oriente-platform

Monorepo (pnpm workspaces) de la plataforma Yamaha Oriente, compuesto por tres paquetes:

- **`web/`** — sitio público. Next.js 15 + React 19 + TypeScript + Tailwind 4 + Sass + TanStack Query + Biome + PWA. Migrado desde `yamaha-motohertz`.
- **`backend/`** — API GraphQL. Node ≥18 + TypeScript + Express 4 + Apollo Server 5 + PostgreSQL 17 + Drizzle + Redis + Zod + Jest. Migrado desde `xavi-platform-node`. Despliegue en Cloud Run.
- **`cms-admin/`** — headless CMS admin. Arquitectura a definir (ver Fase 3 del plan).

## Requisitos

- Node.js ≥ 18
- pnpm ≥ 9

## Desarrollo

```bash
pnpm install
pnpm dev:web
pnpm dev:backend
pnpm dev:cms
```

## Plan de construcción

El proyecto se construye por fases documentadas en [`docs/PLAN.md`](docs/PLAN.md). Cada fase tiene su propio documento en `docs/phases/`.
