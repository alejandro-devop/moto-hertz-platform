# Fase 5 — Integración end-to-end

## Objetivo

Conectar `web` y `cms-admin` al `backend` propio de forma real, retirando dependencias temporales (ej. Contentful en `web`), con datos de prueba fluyendo de extremo a extremo: se crea/edita contenido en `cms-admin` → se refleja en `backend` → se ve en `web`.

## Prerrequisitos

- Fases 1, 2 y 4 completadas.

## Pasos detallados

1. En `web`, reemplazar la capa `src/services/contentful.ts` (y tipos asociados) por un cliente GraphQL apuntando al `backend` propio, preservando la misma interfaz de hooks (`useHomeData`, etc.) para minimizar cambios en componentes.
2. Definir variables de entorno compartidas: URL del backend GraphQL para `web` y `cms-admin` (`.env.example` en cada paquete).
3. Poblar datos de prueba (seed) en `backend` para los dominios ya implementados (motos, servicios, noticias, puntos de atención).
4. Verificar en `web` que las páginas (`/motos`, `/servicios`, `/puntos-atencion`, `/noticias`) renderizan datos reales del backend, no mocks (`src/data/*-mock.json` pasan a ser solo fallback/desarrollo, no fuente principal).
5. Verificar en `cms-admin` que crear/editar una moto desde el admin se refleja en `web` tras refrescar (o revalidación ISR/on-demand si `web` usa SSG/ISR).
6. Documentar el flujo de datos completo en `docs/architecture/data-flow.md`.

## Entregables

- `web` sin dependencia de Contentful.
- Flujo de datos documentado y verificado manualmente.

## Criterios de aceptación (DoD)

- [ ] Un cambio hecho en `cms-admin` es visible en `web` sin tocar código.
- [ ] `src/services/contentful.ts` y tipos asociados fueron removidos o marcados explícitamente como legado no usado.
- [ ] `docs/architecture/data-flow.md` existe.

## Riesgos / notas

- Si `web` usa Server Components con fetch en build-time (SSG), hay que decidir estrategia de revalidación (ISR con `revalidate`, o on-demand revalidation triggerada desde `cms-admin` al publicar).
