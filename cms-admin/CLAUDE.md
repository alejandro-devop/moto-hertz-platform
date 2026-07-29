# CLAUDE.md — cms-admin (yamaha-oriente-cms-admin)

> Scaffold inicial en Fase 4 del plan monorepo. Ver `../docs/phases/04-scaffold-cms.md` y la decisión de arquitectura en `../docs/architecture/cms-admin.md`.

## Qué es este proyecto

Panel de administración custom que edita el contenido servido por `../backend` (motos, puntos de atención, servicios, noticias, banners, configuración del sitio). Sin CMS externo — habla directamente con el GraphQL propio.

## Stack

Next.js 15 (App Router) · TypeScript · React 19 · Tailwind v4 · shadcn/ui · TanStack Query · graphql-request

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
app/(admin)/<dominio>/page.tsx  ← tabla (TanStack Query) + acciones crear/editar/eliminar
app/(admin)/<dominio>/<dominio>-form-dialog.tsx ← formulario en Dialog de shadcn/ui
```

Las mutaciones de escritura requieren sesión (`requireAuth` en el backend); el proxy `/api/graphql` ya adjunta el token en cada request, no hay que hacer nada adicional en el componente.

Los módulos `puntos-de-atencion`, `servicios`, `noticias` están como placeholders "próximamente" — se completan siguiendo este mismo patrón una vez el backend implemente su capa de servicio/GraphQL (ver `backend/CLAUDE.md`, tabla de dominios).

## Dev

```bash
pnpm --filter yamaha-oriente-cms-admin dev   # http://localhost:3001
```

Requiere `../backend` corriendo en `http://localhost:8080` (`npm run docker:up` en `backend/`). URL configurable con `BACKEND_GRAPHQL_URL` (ver `.env.example`).

## Gestión de medios

Por ahora no hay upload de imágenes desde el CMS — los campos de imagen son URLs de texto libre (decisión Fase 3: almacenamiento en folder local del servidor, integración de upload pendiente para una fase posterior).
