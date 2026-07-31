# CLAUDE.md — cms-admin (yamaha-oriente-cms-admin)

> Scaffold inicial en Fase 4 del plan monorepo. Ver `../docs/phases/04-scaffold-cms.md` y la decisión de arquitectura en `../docs/architecture/cms-admin.md`.

## Qué es este proyecto

Panel de administración custom que edita el contenido servido por `../backend` (motos, puntos de atención, servicios, noticias, banners, configuración del sitio). Sin CMS externo — habla directamente con el GraphQL propio.

## Stack

Next.js 15 (App Router) · TypeScript · React 19 · Tailwind v4 · shadcn/ui estilo `base-nova` sobre `@base-ui/react` · TanStack Query · graphql-request · next-themes

## Sistema de diseño

> Rediseño con prioridad UX y paridad escritorio/móvil. Toda acción del panel es alcanzable en las dos pantallas.

**Tipografía.** `IBM Plex Sans` para la interfaz y `IBM Plex Mono` para datos (precios, fechas, slugs, kilometraje). Son la misma superfamilia a propósito: el texto y las cifras de las columnas comparten proporciones y tono. Se cargan con `next/font/google` en `app/layout.tsx` y se exponen como `--font-plex-sans` / `--font-plex-mono`.

> **Dos reglas que hay que respetar o el panel vuelve a verse en Times New Roman.** Las clases de `next/font` van en **`<html>`, no en `<body>`**: `globals.css` consume las variables desde `:root`, y si vivieran en `<body>` no existirían al resolverse ahí, la declaración quedaría inválida y `font-family` caería al serif por defecto. Y en `@theme inline` la pila va **completa** (`--font-sans: var(--font-plex-sans), ui-sans-serif, …`), nunca `--font-sans: var(--font-sans)`, que se autorreferencia. El scaffold original fallaba por ambas cosas, así que Geist nunca llegó a cargarse.
>
> Para comprobarlo no basta con mirar: en la consola del navegador, `getComputedStyle(document.documentElement).fontFamily` tiene que empezar por `"IBM Plex Sans"`, y `[...document.fonts].filter(f => f.status === 'loaded')` tiene que listarla.

**Color.** «Amarillo de placa sobre asfalto». El acento (`--primary`, `#F2C230`) es el único color saturado: acción principal, destino activo y foco. Los estados (`--success` / `--warning` / `--destructive`) son semánticos y viven aparte del acento. La barra de navegación (`--rail-*`) se queda en asfalto en los dos temas: es la constante del producto. Tema claro y oscuro con `next-themes`, selector en la barra superior (escritorio) y en la hoja «Más» (móvil).

**Reglas.** Objetivos de 44 px en móvil (`h-11 md:h-9`), foco visible en todo control, cifras con `tabular-nums`. La utilidad `scroll-x` es para tiras horizontales: `overflow-x: auto` a secas convierte el eje vertical en `auto` y saca una barra sobrante.

## Estructura del panel

`app/(admin)/layout.tsx` es `force-dynamic` (toda ruta exige cookie de sesión, y así `useSearchParams` funciona en los filtros) y solo monta `components/admin/admin-shell.tsx`:

| Componente | Escritorio | Móvil |
| --- | --- | --- |
| `admin-rail.tsx` | barra lateral colapsable (persiste en `localStorage`) | oculta |
| `admin-tabbar.tsx` | oculta | barra inferior de 5 destinos + hoja «Más» |
| `admin-topbar.tsx` | buscador visible + tema + sitio público | marca, sección y lupa que despliega el buscador |

El buscador (`admin-search.tsx`) escribe en `?q=` de `/motos`; `⌘K` lo enfoca desde cualquier pantalla.

Piezas compartidas de presentación: `page-header`, `states` (vacío, error, esqueletos), `status-pill`, `thumb`, `proximamente`.

Piezas compartidas de módulo, extraídas de `motos` en la Fase 0 del plan CMS (receta completa en `../docs/cms-plan/PATRON.md`):

| Pieza | Archivo | Qué resuelve |
| --- | --- | --- |
| `ListaResponsive` | `components/admin/responsive-list.tsx` | Tabla en escritorio, tarjetas en móvil, paginación en las dos. La fila y la tarjeta las pone cada módulo. |
| `Paginacion` | `components/admin/pagination.tsx` | Primera, última y las vecinas de la actual. |
| `BarraFiltros`, `SelectFiltro`, `FilterChip`, `opcionesDe` | `components/admin/filter-bar.tsx` | Fila de filtros en escritorio y hoja inferior en móvil, con el contador de filtros puestos. |
| `RowActions`, `AccionFila` | `components/admin/row-actions.tsx` | La misma lista de acciones como menú de fila (escritorio) y como hoja inferior (móvil). |
| `FormSheet` | `components/admin/form-sheet.tsx` | Armazón de la ficha: pestañas por sección con contador de errores, barra de guardado fija y aviso antes de descartar. |
| `Field`, `ToggleRow`, `Grid`, `ALTO_CAMPO` | `components/admin/form-fields.tsx` | Los controles de la ficha. `ALTO_CAMPO` = `h-11 md:h-9`. |
| `leerOpcion`, `escribirParams`, `paginar`, comparadores | `lib/list-params.ts` | Filtros en la URL (solo se serializa lo que se desvía del valor por defecto), orden y paginación. |
| `useFiltrosUrl` | `lib/use-url-filters.ts` | `{ filtros, actualizar, limpiarTodo }`; **`actualizar` vuelve a la página 1**. |
| `SeccionFicha`, `seccionDeCampo`, `erroresPorSeccion` | `lib/form-sections.ts` | La forma de una sección de ficha y dónde cae cada error. |
| `erroresDeZod`, `listaDesdeTexto`, `textoDesdeLista`, `textoOpcional` | `lib/form-state.ts` | Plomería del estado de la ficha. |

**Lo que quedó sin abstraer a propósito**: la fila/tarjeta de cada dominio (`<x>-row.tsx`), el estado de la ficha (15 líneas de `useState`/`useRef`/`useEffect`) y el diálogo de precio rápido. El `GalleryEditor` de fotos sí se extrajo: la Fase 1 lo reescribió como `components/admin/image-picker.tsx` con subida real. El razonamiento está en `../docs/cms-plan/PATRON.md`, sección «Lo que no se abstrajo, y por qué».

## Autenticación

Un solo admin (sin roles), credenciales por variable de entorno del backend (`ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`). Flujo:

1. `app/login/page.tsx` hace `POST /api/auth/login` con email/password.
2. `app/api/auth/login/route.ts` llama a la mutation `login` del backend y, si es válida, guarda el JWT en una cookie **httpOnly** (`lib/session.ts`).
3. `middleware.ts` exige la cookie en toda ruta salvo `/login` y `/api/auth/*`.
4. Las queries/mutations del navegador van a `/api/graphql` (`app/api/graphql/route.ts`), que lee la cookie server-side y reenvía al backend con `Authorization: Bearer <token>` — el JWT nunca es accesible desde JS del cliente.

## Patrón de módulo CRUD (referencia: `motos`)

> La receta paso a paso, en las tres capas del monorepo, está en **`../docs/cms-plan/PATRON.md`**. Aquí solo el resumen de esta capa.

Cada dominio administrado sigue esta estructura, replicando `app/(admin)/motos/`:

```
lib/graphql/<dominio>.ts        ← documentos GraphQL + tipos TS
app/(admin)/<dominio>/page.tsx           ← lista + orquestación de diálogos
app/(admin)/<dominio>/filters.ts         ← tipos y funciones puras de filtro/orden/página
app/(admin)/<dominio>/use-<dominio>.ts   ← query y mutaciones (TanStack Query)
app/(admin)/<dominio>/<x>-row.tsx        ← fila de tabla + tarjeta de móvil
app/(admin)/<dominio>/<x>-actions.tsx    ← qué acciones hay + sus confirmaciones
app/(admin)/<dominio>/<x>-filters.tsx    ← los desplegables y chips concretos
app/(admin)/<dominio>/form-sections.ts   ← en qué secciones se parte la ficha
app/(admin)/<dominio>/<x>-form-sheet.tsx ← contenido de cada sección de la ficha
app/(admin)/<dominio>/<x>-form-state.ts  ← estado plano, mapeo y validación Zod
```

Las mutaciones de escritura requieren sesión (`requireAuth` en el backend); el proxy `/api/graphql` ya adjunta el token en cada request, no hay que hacer nada adicional en el componente.

### Decisiones del módulo `motos`

**Filtros en la URL.** `q`, `estado`, `condicion`, `marca`, `sede`, `papeles`, `orden` y `pagina` viven en `searchParams` (solo se serializa lo que se desvía del valor por defecto). Se pueden compartir y el botón de atrás funciona.

**Filtrado en el cliente.** La query `motorcycles` del backend no busca ni ordena, y buscar es lo que más se hace aquí. `use-motorcycles.ts` trae el catálogo completo en páginas de 100 (tope del validador) y filtra en memoria. Con ~120 motos la búsqueda es instantánea; **si el catálogo llega a unos pocos miles hay que mover búsqueda, orden y paginación a la query**.

**Estado de publicación derivado.** El backend no tiene campo `status`, solo `available` y `featured`. `lib/motorcycle-status.ts` deriva tres estados de los datos que ya hay: `publicada`, `incompleta` (le falta precio, portada, marca o kilometraje) y `fuera del sitio` (`available: false`). Si algún día el backend expone un `status` real, esto se reemplaza por él.

**Alertas de papeles.** SOAT y tecnomecánica son los únicos datos que caducan solos. `getPaperwork` los clasifica en vigente / por vencer (≤ 30 días) / vencido / sin registrar, y la lista muestra el peor de los dos más una franja de resumen arriba. Solo aplica a motos usadas.

**Falta un campo de matrícula.** El tipo `Motorcycle` no tiene placa, aunque el catálogo legacy la lleva dentro del texto libre de `description` (ver `../docs`). Mientras no exista, la lista identifica la moto por miniatura, nombre, marca, año y kilometraje, y el buscador no puede buscar por placa.

**Marcar como vendida, no eliminar.** La acción principal de una moto vendida es apagar `available` — sale del sitio y el registro queda. Eliminar está al final del menú, separada y con confirmación que nombra la moto; desde la Fase 1 **manda a la papelera**, no borra (ver «Gestión de medios → Papelera»).

**Nombre en la interfaz.** El paquete se sigue llamando `yamaha-oriente-cms-admin` (herencia de la plantilla), pero la interfaz dice «Motos Hot Wheels» porque el catálogo es multimarca. Renombrar el paquete es aparte.

### Decisiones del módulo `puntos-de-atencion`

> Construido en la **Fase 2 del plan CMS** (`../docs/cms-plan/phases/02-puntos-de-atencion.md`), la primera sección hecha entera sobre `PATRON.md`.

**Un punto de atención tiene siete campos**, y ni uno más: nombre, dirección, teléfono, correo, WhatsApp, horarios y ubicación (más `slug` y `type`). **`services`, `image` y `featured` se descartaron** —eran de la plantilla Yamaha— y por eso tampoco salen en la página pública. Las columnas siguen en la tabla, sin usar.

**El tipo es un catálogo cerrado** (`SEDE`, `CONCESIONARIO`, `DISTRIBUIDOR`): desplegable en la ficha y filtro fiable en la lista. Los valores salen de lo que publica el sitio legacy. Agregar uno toca `ETIQUETAS_TIPO` en `app/(admin)/puntos-de-atencion/filters.ts` y tres sitios del backend (ver `backend/CLAUDE.md`).

**La ubicación se captura pegando el enlace de Google Maps**, no escribiendo coordenadas. La ficha avisa mientras se escribe si el enlace trae coordenadas (`lib/maps-url.ts`, una copia del extractor del backend **solo para el aviso**: quien las guarda es el backend). Los enlaces cortos `maps.app.goo.gl` no las traen y el sitio queda con «Cómo llegar» sin mapa.

**Los horarios se editan día por día** (`hours-editor.tsx`): un interruptor y dos `<input type="time">` por día, con «Copiar a los demás» para no escribir seis veces lo mismo. **Un día apagado está cerrado**; no se guarda ninguna bandera. `lib/service-point-hours.ts` tiene el formato y el resumen de una línea que usa la lista.

**La papelera es un valor del filtro de estado** (`En el sitio` / `En papelera`), igual que en motos y en medios. En la papelera la fila muestra la píldora y el menú se reduce a *Restaurar al sitio* / *Eliminar definitivamente*.

**El buscador de la barra superior ya no manda siempre a `/motos`.** Escribe en `?q=` de la sección donde uno está, con su propio placeholder (`components/admin/admin-search.tsx`, mapa `BUSCADORES`). **Toda lista nueva con búsqueda tiene que agregarse a ese mapa**, o su buscador saca al usuario de la sección.

El módulo `medios` (biblioteca de imágenes) sigue el mismo patrón de lista, con la papelera dentro del filtro de estado. Los módulos `servicios` y `noticias` están como placeholders "próximamente" — se completan siguiendo este mismo patrón una vez el backend implemente su capa de servicio/GraphQL (ver `backend/CLAUDE.md`, tabla de dominios).

## Dev

```bash
pnpm --filter yamaha-oriente-cms-admin dev   # http://localhost:3001
```

Requiere `../backend` corriendo en `http://localhost:8080` (`npm run docker:up` en `backend/`). URL configurable con `BACKEND_GRAPHQL_URL` (ver `.env.example`).

## Gestión de medios

> Construido en la **Fase 1 del plan CMS** (`../docs/cms-plan/phases/01-medios.md`).

**Sí hay subida de imágenes.** Ningún campo de imagen es un `<Input>` de URL: se usa `components/admin/image-picker.tsx`, que trae dos componentes sobre el mismo motor —`ImagePicker` (una imagen) y `GaleriaImagenes` (varias, con portada y orden)—. Los dos hacen arrastrar y soltar, progreso por foto, `accept="image/*"` (en el teléfono ofrece cámara o galería) y **mantienen el campo de pegar URLs externas**, porque el catálogo legacy tiene fotos alojadas fuera.

| Pieza | Archivo | Qué resuelve |
| --- | --- | --- |
| `ImagePicker`, `GaleriaImagenes`, `SubidorMedios` | `components/admin/image-picker.tsx` | Los campos de imagen de toda ficha. |
| `subirImagen`, `formatBytes`, `formatDimensiones` | `lib/media-upload.ts` | La subida con progreso y los formatos de la biblioteca. |
| `/api/media/upload` | `app/api/media/upload/route.ts` | Reenvía el multipart al backend con el JWT de la cookie. |
| Biblioteca | `app/(admin)/medios/` | Listar, buscar, copiar URL, papelera. |

**Tres decisiones que hay que respetar.**

**La subida no pasa por `/api/graphql`.** Ese proxy lee el cuerpo como texto y tiene su propio límite; los binarios van por `/api/media/upload`, que hace lo mismo con el token pero deja el multipart intacto. La subida usa `XMLHttpRequest` y no `fetch` porque `fetch` no informa progreso de subida, y aquí lo que tarda es subir.

**Se sube de a una foto, en el orden en que se eligieron.** Una moto lleva 16–18 y llegan numeradas: en paralelo se desordenan y ponen a `sharp` a procesar varias a la vez en un droplet chico.

**En el estado de la ficha, una imagen es un `string` con la URL** — no el id del archivo. Así una URL externa y una subida son exactamente el mismo campo. Lo que el backend guarda en el contenido es la URL; la tabla `media` es la biblioteca, no una relación.

### Papelera

Eliminar nunca borra de una vez, ni imágenes ni contenido (`deleted_at` en el backend, ver `../docs/cms-plan/PATRON.md` §1.1).

- **Motos**: «En papelera» es un valor del filtro **estado** en la lista de siempre — no una pantalla aparte. Dispara otra consulta (`trashed: true`) con su propia caché, la fila muestra la píldora «En papelera» y el menú cambia a *Restaurar al catálogo* / *Eliminar definitivamente*.
- **Medios**: la papelera vive dentro de la biblioteca, en el mismo filtro. Una imagen en la papelera **sigue respondiendo su URL**: recién al eliminar definitivamente se borra el archivo del servidor.
- **Quitar una foto de una ficha solo la desvincula**; el archivo queda en la biblioteca. **Eliminar una moto no toca sus archivos.** No hay rastreo de qué ficha usa qué archivo, a propósito.
