# Fase 4 — Scaffold e implementación inicial del `cms-admin`

## Objetivo

Construir el esqueleto funcional de `cms-admin` según lo decidido en la Fase 3, con autenticación básica y al menos un módulo CRUD completo contra el `backend`.

## Prerrequisitos

- Fase 3 completada: `docs/architecture/cms-admin.md` existe con la decisión de arquitectura confirmada.
- Fase 2 completada: `backend` expone GraphQL con al menos un dominio real.

## Contexto / decisiones previas

- Este documento se debe releer y ajustar según lo que se decidió en la Fase 3, ya que en el momento de escribir este plan aún no existe esa decisión. Los pasos siguientes asumen la ruta más probable (Opción A/C: admin custom en Next.js sobre el GraphQL propio) — ajustar si el usuario eligió otra ruta.

## Pasos detallados (asumiendo admin custom en Next.js)

1. Scaffold de `cms-admin/` como paquete Next.js + TypeScript dentro del workspace pnpm (`pnpm --filter cms-admin ...`).
2. Elegir y configurar librería de componentes de admin (ej. shadcn/ui + Tailwind) — separado del sistema visual público de `web`.
3. Cliente GraphQL apuntando a `backend` (reutilizar TanStack Query + un cliente GraphQL ligero, ej. `graphql-request`, consistente con lo ya usado en `web`).
4. Implementar autenticación según lo decidido en Fase 3 (login, sesión, roles si aplica).
5. Implementar el primer módulo CRUD completo (ej. gestión de "motos"): listado, crear, editar, eliminar, con validación en el front y contra los validators Zod del backend.
6. Definir layout base del admin (navegación entre módulos, estructura de páginas) pensando en que se irán añadiendo el resto de entidades (servicios, noticias, puntos de atención, medios) de forma incremental fuera de este plan de fases inicial, o como sub-tareas de esta misma fase si el usuario prefiere completarlas todas aquí.
7. Commit: "feat(cms-admin): scaffold initial admin with auth and first CRUD module".

## Entregables

- Paquete `cms-admin/` funcional en dev, con login y un CRUD real conectado al backend.

## Criterios de aceptación (DoD)

- [ ] `pnpm --filter cms-admin dev` levanta el admin sin errores.
- [ ] Login funcional contra el backend.
- [ ] CRUD de al menos una entidad funciona de punta a punta (crear/editar/eliminar visible en la DB vía Drizzle/Adminer).
- [ ] Usuario confirma que el patrón de CRUD es el esperado para replicarlo en las demás entidades.

## Riesgos / notas

- Si en la Fase 3 se elige adoptar un CMS externo en vez de construir uno custom, este documento debe reescribirse completamente antes de ejecutar esta fase.
