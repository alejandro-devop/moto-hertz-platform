# Arquitectura de `cms-admin`

## Decisión

`cms-admin` es un panel de administración **custom**, construido con Next.js + TypeScript, que consume directamente el GraphQL del `backend` propio (no hay CMS externo ni fuente de verdad de datos paralela). Decisión confirmada por el usuario en la Fase 3.

## Stack

- **Framework**: Next.js + TypeScript.
- **UI**: shadcn/ui (componentes headless + Tailwind), consistente con un panel de admin — no reutiliza el diseño público de `web`.
- **Cliente de datos**: TanStack Query + `graphql-request` contra el GraphQL del `backend`.

## Alcance de entidades administradas

- Motos (specs, precios, imágenes).
- Puntos de atención (service points).
- Servicios.
- Noticias.
- Banners de home.
- Configuración general del sitio (SEO, contacto).

Corresponde 1:1 con los dominios ya modelados en el `backend` (motorcycle, service-point, service, news) más entidades de configuración/banners a agregar en Fase 4/5.

## Autenticación y roles

Un solo rol admin (sin roles diferenciados por ahora). Reutiliza el sistema de auth del `backend`, que hasta la Fase 2 tenía la autenticación diferida como placeholder — se implementará en la Fase 4/5 pensando únicamente en este caso de uso (un usuario admin), sin necesidad de autorización granular por rol.

## Gestión de medios

> Implementado en la **Fase 1 del plan CMS** (`docs/cms-plan/phases/01-medios.md`),
> que amplió la decisión original: no es una carpeta a secas, es un **driver**.

Las imágenes (motos, noticias, banners) se suben desde el panel y se guardan a
través de una interfaz de almacenamiento (`backend/src/shared/storage/`) con el
driver elegido por `STORAGE_DRIVER`. Hoy existe **un solo driver, `local`**:
carpeta del servidor del `backend` (volumen Docker `media_data`) servida como
archivos estáticos bajo `/media/**`. No se usa servicio externo todavía; el día
que haya un bucket, agregar S3 o GCS es escribir un archivo en esa carpeta y
mover una variable de entorno — la receta está en
`backend/src/shared/storage/README.md`.

Tres decisiones que van con esto:

- **Se procesa al subir.** `sharp` reduce el lado mayor a 1600 px y convierte a
  WebP; el original **no se conserva**. Una foto de teléfono son 4–8 MB y una
  moto lleva 16–18.
- **Hay una tabla `media` y una biblioteca** (`/medios` en el panel), con
  papelera: eliminar una imagen la manda a la papelera, restaurarla la devuelve,
  y eliminarla definitivamente borra el archivo del almacenamiento.
- **Quitar una foto de una ficha solo la desvincula**, y eliminar un registro de
  contenido no toca sus archivos. No hay rastreo de qué ficha usa qué archivo.

**Deudas conocidas.** (1) El almacenamiento local no sobrevive a recrear el
droplet ni escala a varias instancias — para eso está el driver. (2) La URL
pública se calcula al subir y se guarda tal cual dentro del contenido: cambiar
de dominio o de driver obliga a reescribir esas URLs (la tabla `media` guarda la
clave, así que es un `UPDATE` mecánico).

## Papelera (soft delete)

Desde la Fase 1 del plan CMS, `media` y las cuatro tablas de contenido
(`motorcycles`, `service_points`, `services`, `news`) tienen `deleted_at`.
Eliminar desde el panel manda a la papelera; el sitio público nunca ve lo
borrado. El patrón que debe seguir cada sección nueva está en
`docs/cms-plan/PATRON.md`, sección «Soft delete».

## Previsualización de contenido

No se implementa preview en vivo del contenido en `web` por ahora. El flujo de trabajo es: editar en `cms-admin` → publicar → verificar visitando el sitio público. Se puede revisar en una fase futura si se identifica la necesidad real.
