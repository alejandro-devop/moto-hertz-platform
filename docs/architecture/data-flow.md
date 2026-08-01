# Flujo de datos — yamaha-oriente-platform

> Escrito originalmente en la Fase 5 del plan del monorepo (`docs/phases/05-integracion-e2e.md`),
> cuando solo `motorcycle` estaba integrado de punta a punta y los otros tres
> dominios de contenido (`service-point`, `service`, `news`) solo tenían tabla
> y migración SQL, sin capa GraphQL. Reescrito al cerrar la **Fase 7 del plan
> CMS** (`docs/cms-plan/phases/07-qa-y-cierre.md`), que es la última: los siete
> dominios están integrados de punta a punta y `web/src/data/` no tiene ya
> ningún mock. Lo que sigue es el flujo real, no el plan para llegar a él.

## El flujo, igual en los siete dominios

Todo dominio (`motorcycle`, `service-point`, `service`, `news`, `banner`,
`media`, `site-settings`) sigue la misma forma en las tres capas — es la receta
de `docs/cms-plan/PATRON.md`, aplicada siete veces:

```
cms-admin (crear/editar/eliminar)
  → POST /api/graphql (proxy same-origin de Next, adjunta el JWT desde la cookie httpOnly)
    → backend GraphQL (<dominio>Add / <dominio>Edit / <dominio>Remove·Restore·Purge, requireAuth)
      → Drizzle ORM → PostgreSQL

web (páginas públicas, sin sesión)
  → web/src/services/<dominio>.ts (graphqlRequest vía httpClient.post)
    → backend GraphQL (<dominio>s / <dominio>(slug), lectura pública)
      → Drizzle ORM → PostgreSQL
```

- **cms-admin** nunca habla con Postgres ni con el storage directamente: todo
  pasa por el GraphQL del `backend`, autenticado. El proxy `/api/graphql` de
  Next lee la cookie server-side y agrega `Authorization: Bearer <token>`; el
  componente no hace nada especial para autenticarse.
- **web** consulta el mismo GraphQL, sin sesión. Las queries de catálogo son
  públicas — es la Regla #1 de `backend/CLAUDE.md`: toda funcionalidad de
  negocio vive en GraphQL, nunca en rutas Express nuevas (la única excepción es
  la subida de imágenes, que es binario, no JSON).
- **Ambos leen y escriben la misma base**, así que un cambio hecho en el panel
  se ve en el sitio en la siguiente carga — no hay caché intermedia ni caso de
  "publicar" aparte de guardar. `web` sí cachea en el cliente con TanStack
  Query (`staleTime` por página), y algunas páginas usan `revalidate` de
  Next; ver cada página si hace falta el detalle exacto.

## Excepción: medios (binario, no JSON)

La subida de imágenes no pasa por `/api/graphql` — GraphQL no transporta
binarios sin inflar un 33 % en base64. Va por su propia ruta:

```
cms-admin (arrastra o elige un archivo)
  → POST /api/media/upload (Next, adjunta el JWT desde la cookie)
    → POST /api/media (backend, Express, protegido por requireAdmin)
      → sharp (rota por EXIF, recorta a 1600px de lado mayor, convierte a WebP)
        → getStorage() (driver STORAGE_DRIVER, hoy solo `local`) → volumen Docker media_data
          → fila en la tabla `media` (Drizzle)
```

Listar, buscar, mandar a la papelera, restaurar y purgar una imagen sí son
GraphQL (`mediaList`, `mediaTrash`, `mediaRestore`, `mediaPurge` —
`mediaList` es la única query de **lectura** que exige sesión en todo el
proyecto: la biblioteca es herramienta del panel, no contenido del sitio).

**Lo que el contenido guarda no es el id de `media`, es la URL.** Un campo de
imagen en `motorcycle`, `service`, `news` o `banner` es un `string` con la URL
pública — la misma forma para una foto subida por el panel y para una URL
externa pegada a mano (el catálogo legacy tiene fotos alojadas fuera). `web`
no resuelve nada especial para pintar una imagen del panel: es la URL tal
cual. Consecuencia documentada en tres sitios (`backend/CLAUDE.md`,
`cms-admin/CLAUDE.md`, `docs/cms-plan/PATRON.md` §3): cambiar de dominio o de
driver de almacenamiento obliga a un `UPDATE` sobre las URLs ya guardadas — por
eso `media` guarda también la `key` interna, que permite rearmarlas.

## Dos dominios donde el panel y el sitio ven cosas distintas

En los cinco dominios "simples" (`motorcycle`, `service-point`, `service`,
`media`), el panel y el sitio ven exactamente la misma lista con los mismos
argumentos — la única diferencia es la papelera, que nunca es pública. Dos
dominios rompen esa simetría a propósito, mirando `context.user` en el
resolver (nunca un argumento que quien pregunta pudiera manipular):

- **`news`**: sin sesión, la query fuerza `onlyPublished: true` — una noticia
  sin `publishedAt` (borrador) o con fecha futura (programada) no existe para
  `web`, sin importar qué pida el `curl`. Con sesión, se ven todas.
- **`banner`**: sin sesión, la query fuerza `onlyVisible: true` — un banner
  inactivo o fuera de su ventana de vigencia (`startsAt`/`endsAt`) no sale en
  el carrusel público. Con sesión, se ven todos.

Detalle de la regla exacta de cada uno en `backend/CLAUDE.md`.

## `site-settings`: el único dominio que no es una lista

Un registro único (`id = 1` fijo por `CHECK`), sin papelera. `web` lo consume
en dos sitios que no son "una página" sino transversales a todo el sitio:

```
web/src/app/layout.tsx (generateMetadata, async)
  → getSiteSettingsConFallback()
    → título, descripción, Open Graph, Twitter card, keywords

web/src/components/footer/Footer.tsx (next/dynamic, cliente)
  → useSiteSettings() (useIsClient + useQuery)
    → contacto, redes sociales, año de copyright
```

**Con resguardo en las dos puntas**, porque `site-settings` es el dominio del
que depende que el sitio ni siquiera muestre un `<title>` razonable si el
backend está caído:

- `getSiteSettingsConFallback()` devuelve `SITE_SETTINGS_FALLBACK` (los
  valores que antes estaban quemados en el código) si el backend no responde,
  en vez de tumbar la página. Verificado apagando el contenedor real
  (`docker compose stop app`), no simulado.
- `Footer.tsx` (`"use client"`) lee sus datos con `useSiteSettings()`, una
  query de cliente; en la home se carga además por `next/dynamic` (no es
  crítica para el primer pintado). Sin resguardo, el HTML del servidor (que
  no tiene el dato aún) y el del cliente (que sí) podían no coincidir
  (`Hydration failed`) si el valor cambiaba entre un render y otro. Se
  resuelve con `useIsClient` dentro de `useSiteSettings`, el mismo patrón que
  ya usaba `Banner.tsx` desde la Fase 5.

**Lo que queda fuera de este flujo:** `web/public/manifest.json` (el
manifiesto de la PWA) es un JSON estático servido sin build step de Next, no
lee de `site_settings` — ver «`web/manifest.json` no lee de `site_settings`»
en `docs/cms-plan/MEJORAS.md`.

## Rendimiento: dónde busca, ordena y pagina cada lista

Ninguna query de lista del `backend` busca ni ordena — solo pagina
(`page`/`limit`, tope `100`). Los seis módulos de `cms-admin` con lista
(`motos`, `puntos-de-atencion`, `servicios`, `noticias`, `banners`, `medios`)
resuelven esto igual: traen hasta `LIMITE_BACKEND = 100` registros y
buscan/ordenan/paginan **en el cliente**, con TanStack Query cacheando la
respuesta. Es una decisión de la Fase 0 (documentada primero para `motos`,
confirmada como el patrón de todo el panel al revisar en la Fase 7), no un
atajo de una sección: con los volúmenes reales de hoy (decenas de registros
por dominio) cada consulta al backend tarda un dígito de milisegundos. Si
algún catálogo crece a miles de registros, ese módulo puntual tiene que mover
búsqueda, orden y paginación a la query — no todos a la vez.

`web` no pagina en el cliente: cada página pública pide lo que necesita
(`getMotorcycles({ page: 1, limit: 100 })` para el catálogo completo,
`get<Dominio>BySlug` para el detalle) y no tiene UI de "más filtros" que
justifique traer de más.

## Mocks

No queda ninguno. `web/src/data/` está vacía. El último en irse fue
`home-mock.json` (Fase 5), junto con toda la capa de emulación de Contentful
que solo lo servía a él (`services/contentful.ts`, `hooks/useHomeData.ts`,
`components/contentful/`, `types/contentful.ts`,
`utils/contentful-resolver.ts`, `app/api/contentful/home/`). El historial de
qué mock se fue en qué fase está en `docs/cms-plan/PATRON.md` §3.
