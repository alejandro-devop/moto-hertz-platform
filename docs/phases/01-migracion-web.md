# Fase 1 — Migración de `web`

## Objetivo

Poblar `web/` con una copia funcional de `yamaha-motohertz` como plantilla completa (stack, arquitectura, configuración), excluyendo únicamente los assets (imágenes, íconos, videos, fuentes específicas de la marca Motohertz).

## Prerrequisitos

- Fase 0 completada (carpeta `web/` existe dentro del workspace pnpm).

## Contexto / decisiones previas

- Plantilla origen: `/Users/jako/Developer/frontend/web/yamaha-motohertz`.
- Stack a preservar: Next.js 15.5 (Turbopack), React 19, TypeScript, Tailwind 4, Sass, TanStack Query 5 (+ devtools), Biome, next-pwa, sharp/squoosh para optimización de imágenes.
- Arquitectura a preservar: `src/app` (App Router), `src/components`, `src/hooks`, `src/services`, `src/providers`, `src/utils`, `src/types`, `src/config`, `src/styles` (SCSS con `abstracts/`, `critical.scss`, `main.scss`).
- Capa de datos actual (`src/services/contentful.ts`, `src/config/contentful-types.ts`, `src/utils/contentful-resolver.ts`) usa Contentful como CMS. **Decisión pendiente**: ¿se mantiene esta capa apuntando a Contentful temporalmente, o se adapta desde ya para apuntar al `backend` GraphQL propio? Recomendado: mantener la interfaz/abstracción de datos pero migrar el cliente a GraphQL contra `backend` una vez exista (fase 5), para no bloquear esta fase.

## Pasos detallados

1. Copiar la estructura completa de `yamaha-motohertz` a `web/`, **excluyendo**:
   - Todo contenido de `public/` que sean imágenes/videos/iconos de marca Motohertz (revisar carpeta por carpeta).
   - Cualquier asset referenciado dentro de `src/` (ej. imágenes importadas directamente en componentes).
2. Renombrar el proyecto: `package.json` → `name: "yamaha-oriente-web"` (o el nombre que decida el usuario).
3. Actualizar branding textual: nombres, textos, metadata (`layout.tsx`, `viewport.ts`, SEO tags) de "Motohertz" a "Yamaha Oriente" donde aplique — sin inventar copy definitivo, dejar placeholders claros donde falte contenido real.
4. Revisar `src/config/contentful-types.ts` y `src/services/contentful.ts`: documentar como "capa de datos legada, pendiente de migrar en Fase 5" (no eliminar todavía).
5. Adaptar rutas de dominio en `src/app/*` (`motos`, `servicios`, `puntos-atencion`, `noticias`, `en-construccion`) — mantener igual si el sitio de Yamaha Oriente tendrá las mismas secciones; ajustar si el usuario define secciones distintas.
6. Verificar que `pnpm --filter web dev` levanta el sitio correctamente en modo desarrollo.
7. Ejecutar `pnpm --filter web lint` (Biome) y corregir errores de configuración de rutas/paquete.
8. Commit: "feat(web): scaffold from yamaha-motohertz template".

## Entregables

- Paquete `web/` funcional, corriendo en dev, sin assets de Motohertz.
- Documentación breve en `web/README.md` de qué se cambió respecto a la plantilla original.

## Criterios de aceptación (DoD)

- [ ] `pnpm --filter web dev` levanta sin errores.
- [ ] `pnpm --filter web build` compila sin errores.
- [ ] No quedan referencias a assets de `yamaha-motohertz` (imágenes rotas o 404s).
- [ ] No quedan menciones de "Motohertz" en código/UI visible (excepto donde se documente explícitamente como pendiente).
- [ ] Usuario confirma que la interfaz visual base (aunque sin diseño final) es aceptable como punto de partida.

## Riesgos / notas

- Si se elimina un asset referenciado sin reemplazo, el build puede fallar — validar con `pnpm build` antes de dar la fase por cerrada.
- El copy/branding real de Yamaha Oriente probablemente requiera una fase de diseño/contenido aparte, no cubierta en este plan técnico.
