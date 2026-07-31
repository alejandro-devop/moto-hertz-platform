# Flujo de datos — yamaha-oriente-platform

> Fase 5 (`docs/phases/05-integracion-e2e.md`). Documenta qué está integrado de punta a punta contra el `backend` propio y qué sigue mockeado, y por qué.

## Alcance de esta fase

La Fase 5 originalmente asumía que los 4 dominios (motos, servicios, puntos de atención, noticias) ya tenían capa GraphQL en el `backend`. En la práctica, tras la Fase 2 solo **motorcycle** quedó implementado end-to-end (schema, resolvers, service, validadores) — los otros 3 dominios solo tienen tabla y migración SQL (ver `backend/CLAUDE.md`, tabla de dominios). El usuario confirmó acotar esta fase a integrar únicamente **motos**, dejando el resto explícitamente diferido.

## Flujo real: Motos

```
cms-admin (crear/editar/eliminar)
  → POST /api/graphql (proxy same-origin, adjunta JWT desde cookie httpOnly)
    → backend GraphQL (motorcycleAdd / motorcycleEdit / motorcycleRemove, requireAuth)
      → Drizzle ORM → PostgreSQL (tabla `motorcycles`)

web (/motos, /motos/[slug])
  → web/src/services/motorcycles.ts (graphqlRequest vía httpClient.post, sin auth — queries públicas)
    → backend GraphQL (motorcycles / motorcycle, lectura pública)
      → Drizzle ORM → PostgreSQL (tabla `motorcycles`)
```

- **web**: `web/src/services/motorcycles.ts` reemplaza el antiguo `src/data/motorcycles-mock.json` (eliminado). Las páginas `web/src/app/motos/page.tsx` y `web/src/app/motos/[slug]/page.tsx` usan TanStack Query (`useQuery`) contra este servicio. La categoría se deriva de `motorcycle.category` (no existe una colección de categorías separada en el backend); `categorySlug()` replica el criterio kebab-case que usaba el mock.
- **cms-admin**: ya integrado desde la Fase 4 (`cms-admin/app/(admin)/motos/`).
- **Variable de entorno**: `NEXT_PUBLIC_BACKEND_GRAPHQL_URL` en `web/.env.example` (default `http://localhost:8080/graphql`). Es pública porque las queries de catálogo no requieren auth.
- **Verificado manualmente**: crear/editar/eliminar una moto en `cms-admin` se refleja en `web` (`/motos`) tras refrescar, sin ningún cambio de código — incluye la aparición/desaparición de categorías nuevas en el filtro.

## Diferido explícitamente: home, servicios, puntos de atención, noticias

Estos siguen sirviendo datos mock locales, sin cambios en esta fase:

- `web/src/services/contentful.ts` — sigue devolviendo `src/data/home-mock.json` para la home (`/`). El modelo de "layout" de la home (banners, secciones tipo Contentful) no tiene equivalente en el backend todavía; construirlo requeriría diseñar un modelo de contenido genérico o una entidad "banners de home" (mencionada como alcance en la Fase 3, `docs/architecture/cms-admin.md`) que aún no existe en `backend/src/shared/database/schema.ts` más allá de las tablas de servicio/puntos/noticias.
- `web/src/app/servicios/page.tsx` — sigue usando `src/data/services-mock.json`.
- ~~`web/src/app/puntos-atencion/page.tsx`~~ — **resuelto en la Fase 2 del plan CMS**: consume `web/src/services/service-points.ts` contra el backend y `src/data/service-points-mock.json` está eliminado.
- `web/src/app/noticias/page.tsx` — sigue usando `src/data/news-mock.json`.

**Por qué**: el `backend` ya tiene las tablas Drizzle y migraciones para `service_points`, `services` y `news` (Fase 2), pero les falta la capa GraphQL (schema + resolvers + service + validadores Zod), siguiendo el mismo patrón que `motorcycle`. Construir esas 3 capas GraphQL, más un módulo de administración en `cms-admin` para cada una, y luego migrar sus páginas en `web`, es un esfuerzo comparable al de esta misma fase repetido 3 veces — se decidió no expandir el alcance de la Fase 5 y tratarlo como trabajo futuro.

**Plan para retomarlo** (cuando se decida abordar cada dominio):
1. Backend: replicar el patrón de `motorcycle` (`src/graphql/modules/<dominio>/`, `src/services/<dominio>.service.ts`, `src/validators/schemas/<dominio>.schemas.ts`) para `service-point`, `service`, `news`.
2. cms-admin: replicar el patrón de `app/(admin)/motos/` (tabla + Dialog de shadcn/ui + TanStack Query) para cada dominio — patrón ya confirmado por el usuario en la Fase 4.
3. web: reemplazar el mock JSON correspondiente por un servicio GraphQL análogo a `web/src/services/motorcycles.ts`.
4. Para la home, definir primero (con el usuario) el modelo de contenido de banners/layout antes de tocar `contentful.ts`.

`src/services/contentful.ts` permanece en el código, con su comentario existente actualizado para reflejar que sigue siendo temporal más allá de esta fase (no se marcó como legado no usado porque todavía es la fuente de datos activa de la home).
