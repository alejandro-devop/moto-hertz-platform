# Fase 4 — Noticias

## Objetivo

`news` administrable de punta a punta, con el listado y el detalle del sitio
público leyendo del backend.

Es la sección más exigente de las cuatro: tiene **contenido largo**, **fecha de
publicación** (y por tanto borradores y programación) y **página de detalle**.

## Prerrequisitos

- Fase 3 completada.
- Fase 1 completada: una noticia sin imagen de portada no sirve.

## Contexto: los datos que ya existen

Tabla `news` (`backend/src/shared/database/schema.ts`):

`id`, `slug`, `title`, `excerpt`, `content`, `author`, `category`,
`publishedAt`, `featured`, `tags` (array), `image`, `readTime`, `createdAt`,
`updatedAt`.

`web/src/data/news-mock.json` define lo que esperan el listado y el detalle.
Revisar también `web/src/app/noticias/` completo, incluida la ruta de detalle.

## Pasos detallados

1. **Backend.** Patrón completo para `news`. Dos detalles propios de esta
   sección:
   - La query pública **no debe devolver noticias sin publicar ni con
     `publishedAt` en el futuro**; el panel sí las ve todas. Es la primera vez
     en el proyecto que la vista pública y la del panel difieren — dejarlo
     explícito en el resolver y cubierto con un test.
   - Query por `slug` para la página de detalle.
2. **cms-admin.** Módulo `noticias` sustituyendo el placeholder.
   - Lista: título, autor, categoría, fecha de publicación y estado
     (**publicada** / **programada** / **borrador**, derivado de `publishedAt`).
   - Filtros: por estado, categoría y destacada. Búsqueda por título o autor.
   - Orden por defecto: más recientes primero (a diferencia de las otras
     secciones, aquí la fecha manda).
   - Ficha por secciones: **Identidad** (slug, título, autor, categoría,
     portada), **Contenido** (`excerpt` y `content`), **Publicación**
     (`publishedAt`, destacada, `tags`, `readTime`).
   - `content` necesita un editor de texto con formato mínimo (negrita,
     enlaces, listas, encabezados). **Decidir con el usuario** el formato de
     almacenamiento antes de codificar: Markdown en un `textarea` con vista
     previa es lo más barato y reversible; un editor enriquecido es más cómodo
     y más código. La página de detalle de `web` tiene que renderizar lo que se
     elija.
   - `readTime` puede calcularse del contenido y dejarse editable.
3. **web.** Servicio, tipos, listado `/noticias` y detalle `/noticias/[slug]`
   consumiendo el backend. Borrar `web/src/data/news-mock.json`.
4. **Datos.** Cargar las noticias reales del mock antes de borrarlo.

## Entregables

- Dominio `news` completo en las tres capas, con listado y detalle públicos.
- Editor de contenido con el formato acordado.

## Pruebas manuales

1. `pnpm dev` en la raíz.
2. En http://localhost:3001/noticias, crea una noticia **sin** fecha de
   publicación. Debe aparecer como **borrador**.
3. Ve a http://localhost:3000/noticias y confirma que **no** se ve.
4. Vuelve al panel y ponle una fecha de publicación de mañana: debe quedar como
   **programada**, y seguir sin verse en el sitio público.
5. Cambia la fecha a hoy: debe pasar a **publicada** y ahora sí aparecer en el
   sitio.
6. Abre la noticia en el sitio (`/noticias/<slug>`) y comprueba que el contenido
   con formato se ve bien: negritas, enlaces y listas.
7. Sube una imagen de portada y confirma que se ve en el listado y en el detalle.
8. Añade dos etiquetas y verifica que aparecen en el detalle.
9. Filtra por estado "borrador" en el panel; comprueba que el filtro queda en la
   URL.
10. A 390 px: escribe contenido largo en el editor desde el teléfono y guarda —
    la barra de guardado debe seguir alcanzable con el pulgar.
11. Elimina la noticia de prueba y confirma que desaparece de los dos sitios.

## Criterios de aceptación (DoD)

- [ ] Una noticia sin `publishedAt` o con fecha futura no es visible en `web`,
      pero sí en el panel.
- [ ] Existe un test del backend que cubre esa regla.
- [ ] El contenido con formato se guarda y se renderiza igual en el detalle.
- [ ] Crear, editar y eliminar funciona y se refleja en `web`.
- [ ] `news-mock.json` ya no existe y `/noticias` no lo importa.
- [ ] Las noticias que estaban en el mock están cargadas en la base.
- [ ] Tests del service de `news` pasan.
- [ ] `backend/CLAUDE.md` actualiza la tabla de dominios (`news` ✅).

## Riesgos / notas

- La decisión del formato de `content` es la que más condiciona el resto:
  no arrancar a codificar el editor sin confirmarla.
- "Programada" no significa que se publique sola: si nadie recarga, nadie la ve
  igual. Como la query filtra por fecha en cada consulta, funciona sin tareas
  programadas — pero conviene decirlo en la interfaz para no prometer de más.
