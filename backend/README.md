# backend — Yamaha Oriente API

API GraphQL de Yamaha Oriente. Migrada desde `xavi-platform-node` (Fase 2 del plan, ver [`../docs/phases/02-migracion-backend.md`](../docs/phases/02-migracion-backend.md)), reemplazando sus dominios de finanzas/productividad por los propios: `motorcycle`, `service-point`, `service`, `news`.

Ver [`CLAUDE.md`](CLAUDE.md) para patrones de desarrollo, estado de cada dominio y decisiones (auth diferida, etc.).

## Stack

Node ≥18 · TypeScript · Express (legado, solo health) · Apollo Server (GraphQL) · PostgreSQL 17 + Drizzle ORM · Redis · Zod · Jest · Docker

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run docker:up      # postgres + redis + adminer + app (hot reload)
npm run migrate        # aplica las migraciones de motorcycle/service-point/service/news
```

- GraphQL: http://localhost:8080/graphql
- GraphiQL: http://localhost:8080/graphiql
- Adminer (DB UI): http://localhost:8081

## Tests

```bash
npm test
```

## Qué se excluyó de la plantilla original

Se descartó todo el código de dominio de `xavi-platform-node` (wallet, habit, todo, sleep, shopping, routine, learning, course, activity — 24 módulos GraphQL, 37 servicios, 47 migraciones) por no aplicar a Yamaha Oriente. Se conservó únicamente la infraestructura genérica (`shared/`, bootstrap de Express/Apollo, config de tests/Docker/Drizzle) y se construyó `motorcycle` como dominio de referencia completo. `service-point`, `service` y `news` tienen tabla/migración pero su capa de servicio y GraphQL queda para una fase posterior.
