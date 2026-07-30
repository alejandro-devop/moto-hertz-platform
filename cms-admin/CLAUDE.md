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

Piezas compartidas: `page-header`, `states` (vacío, error, esqueletos), `status-pill`, `thumb`, `proximamente`.

## Autenticación

Un solo admin (sin roles), credenciales por variable de entorno del backend (`ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`). Flujo:

1. `app/login/page.tsx` hace `POST /api/auth/login` con email/password.
2. `app/api/auth/login/route.ts` llama a la mutation `login` del backend y, si es válida, guarda el JWT en una cookie **httpOnly** (`lib/session.ts`).
3. `middleware.ts` exige la cookie en toda ruta salvo `/login` y `/api/auth/*`.
4. Las queries/mutations del navegador van a `/api/graphql` (`app/api/graphql/route.ts`), que lee la cookie server-side y reenvía al backend con `Authorization: Bearer <token>` — el JWT nunca es accesible desde JS del cliente.

## Patrón de módulo CRUD (referencia: `motos`)

Cada dominio administrado sigue esta estructura, replicando `app/(admin)/motos/`:

```
lib/graphql/<dominio>.ts        ← documentos GraphQL + tipos TS
app/(admin)/<dominio>/page.tsx           ← lista + orquestación de diálogos
app/(admin)/<dominio>/filters.ts         ← tipos y funciones puras de filtro/orden/página
app/(admin)/<dominio>/use-<dominio>.ts   ← query y mutaciones (TanStack Query)
app/(admin)/<dominio>/<x>-row.tsx        ← fila de tabla + tarjeta de móvil
app/(admin)/<dominio>/<x>-actions.tsx    ← menú de fila / hoja inferior + confirmaciones
app/(admin)/<dominio>/<x>-form-sheet.tsx ← ficha por secciones
app/(admin)/<dominio>/<x>-form-state.ts  ← estado plano, mapeo y validación Zod
```

Las mutaciones de escritura requieren sesión (`requireAuth` en el backend); el proxy `/api/graphql` ya adjunta el token en cada request, no hay que hacer nada adicional en el componente.

### Decisiones del módulo `motos`

**Filtros en la URL.** `q`, `estado`, `condicion`, `marca`, `sede`, `papeles`, `orden` y `pagina` viven en `searchParams` (solo se serializa lo que se desvía del valor por defecto). Se pueden compartir y el botón de atrás funciona.

**Filtrado en el cliente.** La query `motorcycles` del backend no busca ni ordena, y buscar es lo que más se hace aquí. `use-motorcycles.ts` trae el catálogo completo en páginas de 100 (tope del validador) y filtra en memoria. Con ~120 motos la búsqueda es instantánea; **si el catálogo llega a unos pocos miles hay que mover búsqueda, orden y paginación a la query**.

**Estado de publicación derivado.** El backend no tiene campo `status`, solo `available` y `featured`. `lib/motorcycle-status.ts` deriva tres estados de los datos que ya hay: `publicada`, `incompleta` (le falta precio, portada, marca o kilometraje) y `fuera del sitio` (`available: false`). Si algún día el backend expone un `status` real, esto se reemplaza por él.

**Alertas de papeles.** SOAT y tecnomecánica son los únicos datos que caducan solos. `getPaperwork` los clasifica en vigente / por vencer (≤ 30 días) / vencido / sin registrar, y la lista muestra el peor de los dos más una franja de resumen arriba. Solo aplica a motos usadas.

**Falta un campo de matrícula.** El tipo `Motorcycle` no tiene placa, aunque el catálogo legacy la lleva dentro del texto libre de `description` (ver `../docs`). Mientras no exista, la lista identifica la moto por miniatura, nombre, marca, año y kilometraje, y el buscador no puede buscar por placa.

**Marcar como vendida, no eliminar.** La acción principal de una moto vendida es apagar `available` — sale del sitio y el registro queda. Eliminar está al final del menú, separada y con confirmación que nombra la moto.

**Nombre en la interfaz.** El paquete se sigue llamando `yamaha-oriente-cms-admin` (herencia de la plantilla), pero la interfaz dice «Motos Hot Wheels» porque el catálogo es multimarca. Renombrar el paquete es aparte.

Los módulos `puntos-de-atencion`, `servicios`, `noticias` están como placeholders "próximamente" — se completan siguiendo este mismo patrón una vez el backend implemente su capa de servicio/GraphQL (ver `backend/CLAUDE.md`, tabla de dominios).

## Dev

```bash
pnpm --filter yamaha-oriente-cms-admin dev   # http://localhost:3001
```

Requiere `../backend` corriendo en `http://localhost:8080` (`npm run docker:up` en `backend/`). URL configurable con `BACKEND_GRAPHQL_URL` (ver `.env.example`).

## Gestión de medios

Por ahora no hay upload de imágenes desde el CMS — los campos de imagen son URLs de texto libre (decisión Fase 3: almacenamiento en folder local del servidor, integración de upload pendiente para una fase posterior).

Mientras tanto, la sección **Fotos** de la ficha acepta varias URLs pegadas de una vez (separadas por espacios, comas o saltos de línea) y las administra como una sola lista ordenable, donde el primer elemento es la portada — el `images.main` que el backend exige. Las motos del sitio legacy traen entre 16 y 18 fotos cada una, así que escribirlas de a una no es viable.
