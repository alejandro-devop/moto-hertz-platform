# yamaha-oriente-platform

Monorepo (pnpm workspaces) de la plataforma Yamaha Oriente, compuesto por tres paquetes:

- **`web/`** (puerto `3000`) — sitio público. Next.js 15 + React 19 + TypeScript + Tailwind 4 + Sass + TanStack Query + Biome + PWA. Migrado desde `yamaha-motohertz`.
- **`backend/`** (puerto `8080`) — API GraphQL. Node ≥18 + TypeScript + Express 4 + Apollo Server 5 + PostgreSQL 17 + Drizzle + Redis + Zod + Jest. Migrado desde `xavi-platform-node`. Despliegue en Cloud Run.
- **`cms-admin/`** (puerto `3001`) — panel de administración headless en Next.js 15 + shadcn/ui, consume el GraphQL del `backend` (ver `docs/architecture/cms-admin.md`).

## Requisitos

- Node.js ≥ 18
- pnpm ≥ 9
- Docker Desktop (para `backend` + PostgreSQL + Redis + Adminer)

## Desarrollo — levantar todo el stack

```bash
pnpm install
pnpm dev
```

Esto levanta `backend` + PostgreSQL + Redis + Adminer en Docker (`docker compose up -d`, con hot-reload vía volúmenes) y corre `web` y `cms-admin` en paralelo con `pnpm dev` nativo. No hace falta crear archivos `.env`: cada paquete tiene defaults de desarrollo (ver `.env.example` en `web/`, `backend/` y `cms-admin/` si necesitas sobreescribir algo).

Servicios disponibles:

| Servicio    | URL                              |
| ----------- | --------------------------------- |
| web         | http://localhost:3000             |
| cms-admin   | http://localhost:3001             |
| backend     | http://localhost:8080/graphql     |
| adminer     | http://localhost:8081             |
| postgres    | localhost:5432                    |
| redis       | localhost:6379                    |

Para bajar el stack de Docker: `pnpm docker:down` (o `pnpm docker:stop` para detenerlo sin borrar los contenedores). Logs del backend: `pnpm docker:logs`.

### Levantar paquetes por separado

```bash
pnpm dev:web       # solo web (nativo)
pnpm dev:cms       # solo cms-admin (nativo)
pnpm docker:up     # solo backend + postgres + redis + adminer (Docker)
pnpm dev:backend   # backend nativo (tsx watch), requiere Postgres/Redis propios
```

## Plan de construcción

El proyecto se construye por fases documentadas en [`docs/PLAN.md`](docs/PLAN.md). Cada fase tiene su propio documento en `docs/phases/`.
