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

**Única excepción vigente**: `POST /api/media` (subida de archivos, `src/routes/media.ts`). GraphQL no transporta binarios — base64 infla un 33 % y obliga a bufferizar el JSON entero. Todo lo demás de medios (listar, papelera, restaurar, purgar) sí es GraphQL.

## Dominios

| Dominio | Estado | GraphQL module | Service |
|---|---|---|---|
| motorcycle | ✅ completo (referencia) | `motorcycle/` | `motorcycle.service.ts` |
| service-point | ✅ completo (puntos de atención) | `service-point/` | `service-point.service.ts` |
| service | ✅ completo (servicios del taller) | `service/` | `service.service.ts` |
| news | ✅ completo (noticias) | `news/` | `news.service.ts` |
| media | ✅ completo (biblioteca de imágenes) | `media/` | `media.service.ts` |
| banner | ✅ completo (carrusel de la portada) | `banner/` | `banner.service.ts` |

`motorcycle` es la referencia de patrón completa (schema Drizzle, migración, service, tipos, validadores Zod, módulo GraphQL con query/mutations).

### `service-point` (Fase 2 del plan CMS)

Tres decisiones que hay que respetar antes de tocarlo:

- **`services`, `featured` e `image` quedaron sin usar.** Venían de la plantilla Yamaha y el usuario los descartó: no están en el SDL ni en el panel. Las columnas siguen en la tabla —borrarlas era una migración por nada— y así está anotado en `schema.ts`.
- **`type` es un catálogo cerrado**, no texto libre: `SEDE`, `CONCESIONARIO`, `DISTRIBUIDOR` (migración `007`, que además lo hizo `NOT NULL`). No es un ENUM de Postgres a propósito: los valores los manda el dominio (enum del SDL + Zod + tipo TS + etiquetas del panel), no la base.
- **La ubicación se guarda como el enlace de Google Maps que se pegó**, y `lat`/`lng` las **deriva el service** con `shared/geo/maps-url.ts` (`@lat,lng`, `!3d…!4d…`, `q=lat,lng`). No se aceptan coordenadas de afuera: así no puede haber un punto cuyas coordenadas no correspondan a su enlace. Los enlaces cortos `maps.app.goo.gl` no traen coordenadas y se guardan sin ellas — el sitio muestra «Cómo llegar» sin mapa.

`hours` es `{ monday: { open: "09:15", close: "17:00" }, … }` y **un día ausente está cerrado**: no hay bandera `closed`, para que no haya dos formas de decir lo mismo.

### `service` (Fase 3 del plan CMS)

Tres decisiones que hay que respetar antes de tocarlo:

- **`pricing` tiene tres modalidades y una sola forma**: `{ mode, amount?, currency: 'COP', note? }` con `mode` en `DESDE` | `FIJO` | `A_CONVENIR`. **`DESDE` y `FIJO` exigen monto; `A_CONVENIR` no lo lleva** —si llega uno, se descarta en vez de rechazarse, porque la modalidad es lo que el usuario eligió a propósito y el monto es lo que quedó escrito de antes—. Y **un `pricing` en `null` se lee como `A_CONVENIR`**: es la única equivalencia permitida y existe para que un registro creado a mano no deje la tarjeta del sitio en blanco. La moneda no se acepta de afuera: la fija el service. Agregar una modalidad toca cuatro sitios (tipo TS, Zod, enum del SDL y las etiquetas del panel).
- **`icon` guarda el nombre de un icono de `lucide-react` en kebab-case** (`wrench`, `shield-check`), no un emoji. El backend valida la **forma** (minúsculas y guiones, ≤ 60), **no la pertenencia al catálogo**: quién puede elegirse vive en `cms-admin/lib/service-icons.ts` y en su espejo `web/src/utils/service-icons.tsx`, y un nombre desconocido cae en el icono por defecto. Así, ampliar la lista no obliga a desplegar el backend. La migración `008` ensanchó la columna de `VARCHAR(10)` —que solo daba para un emoji— a `VARCHAR(60)`.
- **`category` es texto libre, no un catálogo cerrado** como el `type` de `service-point`. Es deliberado: el usuario está inventando su lista de servicios y una categoría nueva no puede exigir un despliegue. El panel sugiere las que ya existen (`datalist`) y arma el filtro con ellas, así convergen solas.

`features` y `benefits` son **listas ordenadas**: el orden en que llegan es el que se editó en el panel y el que pinta el sitio. Los renglones en blanco se descartan (en el Zod y otra vez en el service), nunca hacen fallar el guardado.

### `news` (Fase 4 del plan CMS)

Es el primer dominio del proyecto donde **la lectura pública y la del panel devuelven cosas distintas con los mismos argumentos**. Todo lo demás en el proyecto —motos, sedes, servicios— muestra al sitio y al panel exactamente la misma lista (menos la papelera, que nunca es pública). `news` no: el sitio nunca puede ver un borrador ni algo programado para el futuro.

- **`publishedAt` es opcional, sin valor por defecto** (migración `009`; la plantilla la traía `NOT NULL DEFAULT now()`, así que toda noticia nacía «publicada»). La regla, que vive en `news.service.ts`: `publishedAt` ausente = **borrador**; en el futuro = **programada**; hoy o antes = **publicada**. El panel deriva esas tres etiquetas (`cms-admin/lib/news-status.ts`); el backend solo guarda la fecha o su ausencia, nunca un campo `status`.
- **Quién decide si se aplica la regla es el resolver, nunca el cliente.** `newsList` y `news(slug)` (`news.resolvers.ts`) miran `context.user`: sin sesión, se fuerza `onlyPublished: true` y `trashed: false` **sin importar lo que pida quien pregunta** — un `curl` sin `Authorization` no puede pedir un borrador ni la papelera cambiando argumentos. Con sesión, se ven todas (`onlyPublished: false`) y `trashed` se respeta tal cual llega. Cubierto con un test explícito en `tests/unit/graphql/news.resolvers.test.ts`, porque el service por sí solo no decide esto: solo obedece la opción que le llega.
- **`author` es texto** (el nombre, nada más) y **`image` es texto** (la URL de la portada, mismo campo que `service.image`). La plantilla traía `author: { name, avatar }` e `image: { main, thumbnail, alt }`; se simplificaron en la migración `009` porque el avatar nunca tuvo archivos reales y el pipeline de medios (Fase 1) no genera una miniatura aparte de la foto principal — guardar esos campos era guardar algo que el panel nunca iba a poder llenar de verdad. Mismo criterio que ya se usó para recortar `service-point`.
- **`category` es texto libre con sugerencias**, igual que en `service` y por la misma razón: el panel sugiere las que ya existen, no fuerza un catálogo.

**Editor de contenido: HTML de un editor enriquecido (Tiptap), no Markdown.** Se acordó con el usuario al construir esta fase (el documento la dejaba abierta). `content` guarda el HTML que produce `editor.getHTML()` — el formato nativo de Tiptap, sin una conversión intermedia que pudiera perder formato. Dos razones para HTML sobre JSON: `web` lo renderiza sin traer Tiptap ni su esquema al bundle público, y el campo sigue siendo `content: String` como cualquier otro texto largo del proyecto, sin un tipo GraphQL nuevo.

**El HTML se sanea dos veces, no una, y con la misma librería en las dos capas.** `news.service.ts` limpia `content` con `sanitize-html` **antes de guardar** (`createNews`/`updateNews`), y `web` lo vuelve a sanear **al pintarlo** (`web/src/utils/sanitize-news-content.ts`, también con `sanitize-html`) antes de un `dangerouslySetInnerHTML`. Es cinturón y tirantes: hoy solo el admin único del panel escribe contenido y Tiptap ya restringe lo que su propio editor puede producir, pero `content` sigue siendo un `String` en el input de la mutación — nada impide una llamada hecha a mano con un JWT robado. Las etiquetas permitidas son las mismas en las dos capas y están escritas en los dos archivos porque **son paquetes distintos y ninguno depende del otro** (mismo criterio que el catálogo de iconos de `service`): `p`, `br`, `strong`/`b`, `em`/`i`, `u`, `s`/`del`, `h1`–`h4`, `ul`/`ol`/`li`, `a` (con `href`; `target`/`rel` se fuerzan a `_blank`/`noopener noreferrer`), `blockquote`, `code`, `pre`, `hr`. Si se amplía la lista, hay que tocar los dos sitios.

**`web` usa `sanitize-html`, no `isomorphic-dompurify`, y no por preferencia sino porque el primer intento con DOMPurify se rompió en la práctica.** `isomorphic-dompurify` corre `DOMPurify` sobre `jsdom` cuando no hay `window` (el servidor), y bajo Turbopack (Next 15) esa página —«use client», pero Next igual la renderiza una vez en el servidor— fallaba con `ENOENT … jsdom/lib/jsdom/browser/default-stylesheet.css`: Turbopack no resuelve bien la ruta que `jsdom` usa para leer un CSS de su propio paquete. `sanitize-html` no toca el DOM (parsea con `htmlparser2`), así que no depende de eso y corre igual en servidor y navegador. Ambas librerías dependen de `htmlparser2`; el backend fija `sanitize-html` en `2.13.0` porque versiones más nuevas (`2.14+`) suben a `htmlparser2` v12, que se distribuye solo en ESM y rompe a Jest (`ts-jest` en modo CommonJS) con «Cannot use import statement outside a module» — anotado también donde se fija la versión, en `package.json`.

`tags` es una **lista sin orden relevante** (a diferencia de `features`/`benefits` de `service`): son etiquetas, no pasos ni beneficios, así que el panel las edita con `ListaEditable` igual, pero mover una no cambia nada en el sitio.

`readTime` es texto libre, editable a mano; el panel sugiere un valor calculado del contenido (`cms-admin/lib/news-status.ts`) pero no lo impone.

### `banner` (Fase 5 del plan CMS)

Primera tabla nueva que crea el plan CMS (migración `010`, `home_banners`): `service_points`, `services` y `news` ya existían de la plantilla, esta no.

**Alcance mínimo acordado con el usuario.** El documento de la fase dejaba abierto cuánto de la home administrar (mínimo / medio / máximo); se eligió el mínimo, con una corrección: solo el **carrusel de banners** es administrable desde el panel. El segundo banner ancho («Financia tu próxima Yamaha») y los títulos de cada sección de la home (`Servicios Yamaha`, `Últimas Noticias`, sus subtítulos) quedan **fijos en el código de `web`**, no en este dominio. La home tampoco inventa sus propias tarjetas de servicios/noticias: `web/src/app/page.tsx` consulta las mismas `getServices()`/`getNews()` que ya usan `/servicios` y `/noticias` — antes vivían hardcodeadas y duplicadas en `web/src/data/home-mock.json`, borrado en esta fase junto con toda la capa de emulación de Contentful que solo servía a la home (`services/contentful.ts`, `hooks/useHomeData.ts`, `components/contentful/`, `types/contentful.ts`, `utils/contentful-resolver.ts`, `app/api/contentful/home/`).

Segundo dominio del proyecto (después de `news`) donde **la lectura pública y la del panel difieren con los mismos argumentos**: la query `banners` mira `context.user` igual que `newsList` — sin sesión, fuerza `onlyVisible: true` (solo `active: true` y dentro de vigencia) y `trashed: false`, sin importar lo que pida quien pregunta; con sesión, ve todos y `trashed` se respeta tal cual llega.

- **`position` es el dato que ordena el carrusel**, y no se acepta en `bannerAdd`/`bannerEdit`: un banner nuevo se agrega al final (`nextPosition()` cuenta los no borrados) y **solo cambia con `bannerReorder(ids: [ID!]!)`**, que reescribe la posición de todos los banners no borrados como el índice de su id en el arreglo que llega, dentro de una transacción.
- **Vigencia opcional en las dos puntas**: `startsAt` ausente = ya vigente; `endsAt` ausente = no vence nunca. Los dos aceptan `null` explícito en la edición (igual que `publishedAt` en `news`) para poder volver a "siempre vigente" sin tocar el resto de la ficha. El Zod rechaza `endsAt` anterior a `startsAt` cuando llegan los dos.
- **`imageMobile` es opcional**: si falta, el sitio usa `image` también en pantallas chicas. A diferencia de las fechas, **no acepta `null`** (mismo criterio que `service.image`/`news.image`: un campo de imagen opcional no se puede limpiar explícitamente desde la ficha, solo se reemplaza por otra URL — es una limitación conocida y pareja en todo el proyecto, no algo nuevo de este dominio).

## Autenticación

Un solo rol admin (sin tabla de usuarios ni roles diferenciados, decisión de Fase 3): las credenciales viven en `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` (bcrypt) por variable de entorno. La mutation `login(email, password)` (`src/graphql/modules/auth/`) verifica contra esas variables y devuelve un JWT (`src/shared/auth/jwt.ts`, secreto en `JWT_SECRET`). `getGraphQLContext` (`src/graphql/server.ts`) valida el header `Authorization: Bearer <token>` en cada request y expone `context.user` si es válido. Las queries de catálogo siguen siendo públicas; las mutaciones de escritura llaman a `requireAuth(context, operationName)` (`src/graphql/utils/error-handler.ts`) para exigir sesión — ver `motorcycle.resolvers.ts` como referencia a replicar en los demás dominios.

**Dos excepciones a «las queries son públicas»**, ambas de la Fase 1: `mediaList` exige sesión (la biblioteca es una herramienta del panel, no contenido del sitio) y el endpoint REST `POST /api/media` va protegido por el middleware `requireAdmin` (`src/shared/middleware/require-admin.ts`), que valida el mismo JWT que las mutaciones.

## Medios y almacenamiento

> Fase 1 del plan CMS. Detalle en `src/shared/storage/README.md`.

Los archivos que suben del panel **nunca se escriben a disco directamente**: pasan por `getStorage()` (`src/shared/storage/`), una interfaz (`put`/`delete`/`url`/`exists`) con el driver elegido por `STORAGE_DRIVER`. Hoy solo existe **`local`** (carpeta `MEDIA_ROOT`, volumen Docker `media_data`, servida en `/media/**` desde `app.ts`). Agregar S3 o GCS es escribir `<nombre>.driver.ts` y registrarlo en el mapa `DRIVERS` — sin tocar services ni resolvers.

Al subir, `src/shared/images/process.ts` (sharp) reduce el lado mayor a 1600 px y convierte a **WebP**; el original no se conserva. La clave es `AAAA/MM/<32 hex>.webp`: no adivinable y sin colisiones. `sharp` es dependencia **nativa**: cambiar deps obliga a reconstruir la imagen de Docker (`docker compose rm -sfv app && docker compose build app && docker compose up -d app`).

## Papelera (soft delete)

`media`, `motorcycles`, `service_points`, `services`, `news` y `home_banners` tienen `deleted_at` (migración `006` para las primeras cinco; `home_banners` nace con la columna en su propia migración `010`, porque es tabla nueva). Todos los dominios de contenido ya tienen su capa de servicio (`motorcycle`, `service-point`, `service`, `news`, `banner`) y `media`:

- Toda lectura filtra `isNull(deletedAt)`; la lista acepta `trashed: Boolean` para pedir la papelera. La búsqueda por **slug** (la que consume el sitio público) nunca devuelve algo borrado; la búsqueda por **id** sí, porque restaurar y purgar trabajan sobre lo borrado. `banner` no tiene slug (no es una página propia), así que ahí la única búsqueda pública es la lista.
- `…Remove` manda a la papelera, `…Restore` la saca, `…Purge` borra de verdad (y falla si no está en la papelera). En `media`, purgar **también borra el archivo** del almacenamiento.
- Eliminar un registro de contenido **no toca sus imágenes**: los archivos se borran solo desde la biblioteca de medios.

`service_points` estrenó su papelera en la Fase 2, `services` en la Fase 3 y `news` en la Fase 4, las tres **sin migración nueva** para eso: la columna ya estaba desde la `006`. En `news` y en `banner`, además, `trashed` **solo tiene efecto con sesión**: sin ella el resolver lo ignora y siempre fuerza `false` (ver «`news` (Fase 4 del plan CMS)» y «`banner` (Fase 5 del plan CMS)» arriba). El patrón a seguir está en `../docs/cms-plan/PATRON.md` §1.1.

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
