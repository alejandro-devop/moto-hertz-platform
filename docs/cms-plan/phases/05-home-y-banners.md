# Fase 5 — Home y banners

## Objetivo

Poder editar la portada del sitio desde el panel. Es la primera fase que crea
tablas nuevas: hoy la home se sirve desde `web/src/data/home-mock.json` a través
de `web/src/services/contentful.ts`.

## Prerrequisitos

- Fase 1 completada (los banners son imágenes; sin subida esto no tiene sentido).
- Fase 4 completada.

## Contexto / decisión pendiente

`contentful.ts` ya no habla con Contentful: devuelve el mock local (decisión de
la Fase 1 del plan del monorepo). Esta fase decide **cuánto de la home se
administra**, y esa decisión hay que tomarla con el usuario antes de escribir
código:

- **Mínimo:** solo el carrusel de banners (imagen, título, enlace, orden,
  activo). El resto de la home queda en el código.
- **Medio:** banners + los bloques de texto destacados de la portada.
- **Máximo:** la home entera como bloques ordenables.

Leer `web/src/data/home-mock.json` completo y presentar al usuario qué contiene
cada parte antes de proponer el alcance. **El plan asume el mínimo**; si se
elige otro, este documento se reescribe antes de ejecutarlo.

## Pasos detallados (asumiendo el alcance mínimo)

1. **Backend — tabla nueva.** `home_banners`: `id`, `title`, `subtitle`,
   `image`, `imageMobile`, `link`, `linkLabel`, `position` (orden), `active`,
   `startsAt`, `endsAt`, `createdAt`, `updatedAt`.
   - Migración SQL nueva siguiendo la numeración de `backend/migrations/`.
   - Añadir la tabla a `backend/src/shared/database/schema.ts`.
2. **Backend — dominio.** Patrón completo para `banner`. La query pública
   devuelve solo los activos y vigentes, ordenados por `position`.
3. **cms-admin.** Módulo `banners` (nueva entrada en `nav-links.ts`, grupo
   "Contenido").
   - La lista es **ordenable**: el orden es el dato principal, así que arrastrar
     para reordenar, con la posición visible.
   - Vista previa de cada banner con su imagen real.
   - Ficha: imagen de escritorio y de móvil, título, subtítulo, enlace y su
     etiqueta, vigencia (`startsAt`/`endsAt`), activo.
4. **web.** La home consume los banners del backend. Decidir qué hacer con
   `contentful.ts`: lo más limpio es que siga siendo la fachada de datos de la
   home y que por dentro llame al backend para la parte de banners.
5. **Datos.** Cargar los banners actuales del mock.

## Entregables

- Tabla `home_banners` con su migración.
- Dominio `banner` completo y módulo de administración con reordenar.
- Home de `web` mostrando los banners del backend.

## Pruebas manuales

1. `pnpm dev` en la raíz.
2. En http://localhost:3001/banners, crea tres banners con imagen y enlace.
3. Arrastra el tercero al primer lugar y comprueba que la posición se guarda
   (recarga la página y confirma que el orden se mantuvo).
4. Ve a http://localhost:3000 y confirma que el carrusel muestra los tres en el
   orden que definiste.
5. Desactiva el del medio en el panel y comprueba que desaparece de la home
   pero sigue en la lista del panel.
6. Ponle a un banner una vigencia que ya terminó (`endsAt` de ayer): debe dejar
   de verse en la home.
7. Sube una imagen distinta para móvil y comprueba en la home a 390 px que se
   usa esa y no la de escritorio.
8. Haz clic en un banner del sitio y confirma que lleva al enlace configurado.
9. Elimina los banners de prueba.

## Criterios de aceptación (DoD)

- [ ] El usuario confirmó el alcance (mínimo / medio / máximo) antes de empezar.
- [ ] Los banners se reordenan arrastrando y el orden persiste.
- [ ] Solo los banners activos y vigentes se ven en la home.
- [ ] La imagen de móvil se usa en pantallas pequeñas.
- [ ] La migración corre limpia en una base desde cero
      (`npm run migrate:fresh` en `backend/`).
- [ ] Tests del service de `banner` pasan.

## Riesgos / notas

- Reordenar arrastrando en móvil es incómodo si se hace mal: dar también botones
  de subir y bajar, como en la galería de fotos de motos.
- Si el usuario elige alcance medio o máximo, el modelo de datos cambia por
  completo (bloques genéricos en vez de banners) — reescribir este documento
  antes de ejecutar, no improvisar sobre la marcha.
