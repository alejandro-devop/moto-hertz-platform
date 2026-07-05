# Fase 2 — Migración de `backend`

## Objetivo

Poblar `backend/` con una copia de la arquitectura de `xavi-platform-node` (Node/TS/Express/Apollo/Drizzle/Postgres/Redis, modo dev con Docker Compose, despliegue a Cloud Run), reemplazando los dominios de negocio (wallet, habit, todo, sleep, etc.) por los dominios propios de Yamaha Oriente (motos, servicios, puntos de atención, noticias, etc.).

## Prerrequisitos

- Fase 0 completada.
- Idealmente Fase 1 en curso/completada, para saber qué datos necesita consumir `web` (motos, servicios, noticias, puntos de atención — ya visibles en las rutas de `yamaha-motohertz`).

## Contexto / decisiones previas

- Plantilla origen: `/Users/jako/Developer/xavi-platform/xavi-platform-node`.
- Stack a preservar: Node ≥18, TypeScript 5, Express 4 (legado, no crecer), Apollo Server 5 (GraphQL, **toda funcionalidad nueva aquí**), PostgreSQL 17 + Drizzle ORM, Redis, Zod, Jest + ts-jest, Docker + docker-compose, migraciones SQL puras en `migrations/`.
- Target de despliegue confirmado: **Cloud Run** (Docker), usando `Dockerfile`, `Dockerfile.dev`, `docker-compose.yml` y `docs/DEPLOYMENT_GUIDE.md` de la plantilla como base.
- Reglas del template a preservar (documentadas en su `CLAUDE.md`): servicios en `src/services/<dominio>.service.ts`, módulos GraphQL en `src/graphql/modules/<dominio>/` (schema.ts + resolvers.ts), tipos en `src/types/services/`, validación Zod en `src/validators/schemas/`, errores tipados (`NotFoundError`, `ForbiddenError`, `BadRequestError`), IDs UUID v7, schema de DB único en `src/shared/database/schema.ts`, cobertura mínima de tests 70%.

## Pasos detallados

1. Copiar de `xavi-platform-node` la infraestructura genérica y reutilizable a `backend/`:
   - `src/shared/` (database, errors, config, logger, uuid, etc.)
   - `src/graphql/` (bootstrap de Apollo, schema/resolvers raíz — vaciar módulos de dominio específicos de finanzas)
   - `Dockerfile`, `Dockerfile.dev`, `docker-compose.yml`, `.dockerignore`
   - `drizzle.config.ts`, carpeta `migrations/` (vaciar migraciones específicas de dominio, dejar solo la infraestructura base si aplica)
   - Configuración de tests (`jest.config.js`, `tests/setup.ts`, `tests/helpers/mocks.ts`)
   - `biome`/`eslint`/`prettier` config, `tsconfig.json`
   - Scripts en `scripts/` que sean genéricos (ej. `generate-bruno-collection.mjs`)
2. **No copiar** los módulos de dominio específicos de xavi (wallet, expense, budget, shopping, habit, routine, activity, todo, sleep, learning, course) — sirven solo como referencia de patrón, no como código a mantener.
3. Definir los dominios propios de Yamaha Oriente en base a lo que `web` necesita consumir (visto en fase 1): candidatos iniciales:
   - `motorcycle` (catálogo de motos, specs, precios)
   - `service-point` (puntos de atención/talleres)
   - `news` (noticias)
   - `service` (servicios ofrecidos: mantenimiento, garantía, etc.)
   - Confirmar esta lista con el usuario antes de modelar la DB.
4. Modelar `src/shared/database/schema.ts` para los dominios confirmados (Drizzle).
5. Crear migraciones SQL en `migrations/` para las tablas nuevas.
6. Implementar el primer módulo GraphQL end-to-end (ej. `motorcycle`) siguiendo el patrón documentado (schema.ts, resolvers.ts, service, types, validators Zod) como caso de referencia para los demás.
7. Levantar entorno local: `docker-compose up` (postgres + redis + adminer + app), correr migraciones, verificar GraphiQL en `http://localhost:8080/graphiql`.
8. Renombrar `package.json` → `name: "yamaha-oriente-backend"`, actualizar `README.md`/`CLAUDE.md` del paquete para reflejar los nuevos dominios (no los de xavi).
9. Commit: "feat(backend): scaffold from xavi-platform-node template with yamaha domains".

## Entregables

- Paquete `backend/` funcional en dev vía Docker Compose.
- Al menos un dominio GraphQL completo end-to-end como referencia de patrón.
- `CLAUDE.md`/`AGENTS.md` propio del backend, adaptado (dominios activos = los de Yamaha Oriente).

## Criterios de aceptación (DoD)

- [ ] `docker-compose up` levanta postgres + redis + app sin errores.
- [ ] Migraciones aplican correctamente sobre una DB limpia.
- [ ] GraphiQL responde al menos una query del dominio de referencia.
- [ ] Tests (`npm test`) corren y pasan para el módulo de referencia.
- [ ] Usuario confirma la lista de dominios antes de continuar a más módulos.

## Riesgos / notas

- Este template trae mucho código de dominio financiero/productividad que NO aplica — el riesgo principal es arrastrar complejidad innecesaria. Preferir copiar poco y reconstruir el dominio desde cero siguiendo el patrón, en vez de adaptar código de wallet/habit línea por línea.
- Definir autenticación: ¿la necesita el sitio público `web`, o solo `cms-admin`? Afecta si se copia el módulo de auth completo desde xavi o se simplifica.
