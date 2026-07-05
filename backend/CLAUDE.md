# CLAUDE.md — backend (yamaha-oriente-backend)

> Migrado desde `xavi-platform-node` (Fase 2 del plan monorepo). Ver `../docs/phases/02-migracion-backend.md`.

## Qué es este proyecto

API GraphQL de Yamaha Oriente, consumida por `../web` (catálogo público) y, más adelante, por `../cms-admin` (panel de administración, ver Fase 3/4).

## Stack

Node.js ≥18 · TypeScript 5 · Express 4 (legado, solo health check) · Apollo Server 5 · PostgreSQL 17 · Drizzle ORM · Redis · Zod · Jest · Docker

## Regla #1 — GraphQL primero

Toda funcionalidad de negocio va en GraphQL, nunca en rutas Express nuevas:

```
src/graphql/modules/<dominio>/   ← schema.ts + resolvers.ts
src/services/<dominio>.service.ts ← lógica de negocio (Drizzle)
src/types/services/<dominio>.types.ts
src/validators/schemas/<dominio>.schemas.ts
```

Registrar en `src/graphql/schema.ts` y `src/graphql/resolvers.ts`.

## Dominios

| Dominio | Estado | GraphQL module | Service |
|---|---|---|---|
| motorcycle | ✅ completo (referencia) | `motorcycle/` | `motorcycle.service.ts` |
| service-point | ⏳ solo tabla en `schema.ts` + migración | — | — |
| service | ⏳ solo tabla en `schema.ts` + migración | — | — |
| news | ⏳ solo tabla en `schema.ts` + migración | — | — |

`motorcycle` es la referencia de patrón completa (schema Drizzle, migración, service, tipos, validadores Zod, módulo GraphQL con query/mutations). Los otros 3 dominios confirmados con el usuario ya tienen tabla y migración, pero su capa de servicio/GraphQL queda pendiente para una fase posterior siguiendo el mismo patrón.

## Autenticación — diferida

**No hay autenticación implementada en esta fase.** Se decidió con el usuario que solo `cms-admin` la necesitará (el sitio público `web` no tiene usuarios finales). Los 4 dominios actuales son de lectura pública; las mutaciones GraphQL no tienen `requireAuth` todavía — se añadirá cuando exista `cms-admin` con un admin autenticado (Fase 3/4). Ver comentario en `src/graphql/server.ts` y en `src/graphql/modules/motorcycle/motorcycle.resolvers.ts`.

## Patrones obligatorios

### Servicio
```typescript
import { getDb } from '../shared/database/drizzle';
import { eq } from 'drizzle-orm';
import { myTable } from '../shared/database/schema';

export const myService = {
  async getItems() {
    const db = getDb();
    return db.select().from(myTable);
  },
};
```

### Resolver GraphQL
```typescript
export const myResolvers = {
  Query: {
    myItems: withValidatedResolver(mySchema, async (_, args) => myService.getItems(args), 'myItems'),
  },
};
```

### Errores
```typescript
import { NotFoundError, ForbiddenError, BadRequestError } from '../shared/errors';
```

### Validación en resolvers
Usar `withValidatedResolver` (en `src/graphql/utils/validation.ts`) con schemas Zod en `src/validators/schemas/`.

### IDs
Siempre UUID v7: `import { generateUuidV7 } from '../shared/database/uuid'` (usado como default en `schema.ts` vía `$defaultFn`).

## Tests

- Framework: Jest + ts-jest
- Setup global: `tests/setup.ts`
- Mocks helper: `tests/helpers/mocks.ts`
- Cobertura mínima configurada: 70% (branches, functions, lines, statements) — aún no alcanzada globalmente, solo `motorcycle.service` tiene test de referencia
- Correr: `npm test` | `npm run test:coverage`

## Migraciones

SQL puro en `migrations/` (numeradas). Nunca Drizzle para migraciones — `schema.ts` es la fuente de verdad del *shape* pero las migraciones son SQL explícito.

```bash
npm run migrate:create   # genera archivo nuevo
npm run migrate          # aplica pendientes
npm run migrate:status   # ver estado
```

## Dev

```bash
npm run docker:up   # levanta postgres + redis + adminer + app (hot reload)
npm run migrate      # aplicar migraciones dentro del contenedor o localmente
```

GraphiQL disponible en `http://localhost:8080/graphiql` (solo development). Adminer en `http://localhost:8081`.

## Schema de DB

**Fuente única de verdad**: `src/shared/database/schema.ts`. Nunca strings literales de tabla — siempre importar desde ahí.
