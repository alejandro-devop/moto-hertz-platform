# web — Yamaha Oriente

Sitio público de Yamaha Oriente. Migrado desde la plantilla `yamaha-motohertz` (Fase 1 del plan, ver [`../docs/phases/01-migracion-web.md`](../docs/phases/01-migracion-web.md)).

## Tecnologías

- Next.js 15 (Turbopack) + React 19 + TypeScript
- Tailwind 4 + Sass
- TanStack Query 5
- Biome (lint/format)
- next-pwa

## Qué cambió respecto a la plantilla original

- **Nombre del paquete**: `yamaha-wheels` → `yamaha-oriente-web`.
- **Branding textual**: reemplazadas todas las menciones de "Motohertz"/"MotoHertz" por "Yamaha Oriente" (metadata, manifest, banner, footer). El copy real (direcciones, teléfonos, redes sociales) sigue siendo de ejemplo — pendiente de contenido definitivo.
- **Assets excluidos**: se excluyeron las fotos de banner (`public/assets/banner-gallery/`) y `public/assets/separator.jpg`, específicas de la campaña de Motohertz. Se conservó `public/assets/logos/yamaha.svg` y el favicon por ser branding genérico de Yamaha.
- **Capa de datos (Contentful) mockeada**: la plantilla integraba Contentful como CMS real. Aquí `src/services/contentful.ts` fue reescrito para devolver datos mock locales (`src/data/home-mock.json`) en vez de llamar a la API real, manteniendo la misma interfaz (`HomePageData`) y el mismo flujo (`/api/contentful/home` → `useHomeData` → `ContentRenderPage`). Esto es **temporal**: en la Fase 5 (integración end-to-end) se reemplaza por un cliente contra el `backend` GraphQL propio, una vez exista `cms-admin`. Ver el comentario en `src/services/contentful.ts` para más detalle.
- Se quitaron los `<link rel="preload">` a imágenes de banner-gallery en `layout.tsx` (apuntaban a assets eliminados).
- `next.config.ts`: se agregó `images.unsplash.com` a `remotePatterns` (usado por las imágenes mock).

## Pendiente / deuda conocida

- Lint (`pnpm --filter web lint`, Biome) reporta ~165 errores/warnings que **ya existían en la plantilla original** `yamaha-motohertz` (no son una regresión de esta migración); no se corrigieron en esta fase por no ser parte de su alcance.
- Los componentes `BannerWrapper.tsx` y `OptimizedHero.tsx` (no usados actualmente en la home) siguen referenciando rutas de `banner-gallery` eliminadas; son código muerto, no afectan el render actual.
- `docs/` conserva la documentación original de la plantilla (Contentful, Vercel, etc.), sin actualizar a este monorepo.

## Desarrollo

```bash
pnpm install
pnpm --filter web dev
```
