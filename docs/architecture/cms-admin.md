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

Las imágenes (motos, noticias, banners) se almacenan inicialmente en un **folder local en el mismo servidor** donde corre el `backend`, servido como archivos estáticos. No se usa un servicio externo (Cloudinary, S3) en esta fase — queda documentado como decisión inicial que puede revisarse más adelante si el volumen de medios o los requisitos de disponibilidad lo justifican.

## Previsualización de contenido

No se implementa preview en vivo del contenido en `web` por ahora. El flujo de trabajo es: editar en `cms-admin` → publicar → verificar visitando el sitio público. Se puede revisar en una fase futura si se identifica la necesidad real.
