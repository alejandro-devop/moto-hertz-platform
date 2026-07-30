# Fase 1 — Medios: subida de imágenes

## Objetivo

Reemplazar los campos de imagen de texto libre por una subida real desde el
panel. Es la única fase que no construye una sección del sitio, y va antes que
las demás para que puntos de atención, servicios, noticias y banners nazcan ya
con el selector de imágenes en vez de con URLs escritas a mano.

## Prerrequisitos

- Fase 0 completada (`docs/cms-plan/PATRON.md` existe).
- `backend` corriendo en Docker con volumen persistente disponible.

## Contexto / decisiones previas

La Fase 3 del plan del monorepo decidió **almacenamiento en carpeta local del
propio servidor**, sin servicio externo tipo S3 o Cloudinary
(`docs/architecture/cms-admin.md`). Esta fase implementa esa decisión. Si el
usuario prefiere cambiarla, hay que confirmarlo antes de empezar: cambia el
paso 1 entero.

Hoy una moto del sitio legacy trae entre 16 y 18 fotos, así que la subida
múltiple no es un extra, es el caso normal.

## Pasos detallados

1. **Backend — almacenamiento y endpoint.**
   - Carpeta de subidas montada como volumen en `docker-compose.yml` (que
     sobreviva a recrear el contenedor), con su ruta configurable por variable
     de entorno.
   - Endpoint REST de subida (multipart) protegido con el mismo JWT que las
     mutaciones — GraphQL no es buen transporte para binarios.
   - Validar tipo de archivo y tamaño máximo; rechazar lo demás con un mensaje
     que diga qué pasó.
   - Servir los archivos estáticamente bajo una ruta pública estable.
   - Nombres de archivo no adivinables y sin colisiones; conservar la extensión.
2. **Backend — limpieza.** Decidir y documentar qué pasa con una imagen cuando
   se borra el registro que la usaba. Lo más simple y honesto para este tamaño
   de proyecto: no borrar nada automáticamente y anotarlo como deuda conocida.
3. **cms-admin — componente de imagen.**
   - Un `ImagePicker` reutilizable: arrastrar y soltar o seleccionar archivo,
     barra de progreso, vista previa, quitar.
   - En móvil debe abrir cámara o galería del teléfono (`accept="image/*"`),
     porque el caso de uso es fotografiar la moto en el patio.
   - Una variante de galería: varias imágenes, reordenar, marcar portada —
     puede partir del `GalleryEditor` que ya existe en
     `cms-admin/app/(admin)/motos/motorcycle-form-sheet.tsx`.
   - Mantener la posibilidad de pegar una URL externa: el catálogo legacy tiene
     imágenes ya alojadas fuera.
4. **cms-admin — adopción en motos.** Reemplazar la sección "Fotos" de la ficha
   de moto por el nuevo componente, sin perder las URLs ya guardadas.
5. **Documentación.** Actualizar `cms-admin/CLAUDE.md` (sección "Gestión de
   medios", que hoy dice que no hay subida) y `docs/architecture/cms-admin.md`.

## Entregables

- Endpoint de subida autenticado + almacenamiento persistente.
- `ImagePicker` y galería reutilizables en `cms-admin`.
- Ficha de moto usando la subida real.

## Pruebas manuales

1. `pnpm dev` en la raíz; entra a http://localhost:3001/motos.
2. Abre una moto → sección **Fotos** → arrastra una imagen desde tu escritorio.
   Debe verse la vista previa y el progreso.
3. Guarda, recarga la página y comprueba que la imagen sigue ahí.
4. Sube tres imágenes más, reordénalas y marca una distinta como portada.
   Guarda y confirma que la portada cambió en la lista.
5. Intenta subir un archivo que no sea imagen (por ejemplo un PDF): debe
   rechazarlo con un mensaje claro, sin romper el formulario.
6. Intenta subir una imagen muy grande (por encima del límite): mismo trato.
7. Abre http://localhost:3001 desde el teléfono en la misma red y sube una foto
   con la cámara.
8. Reinicia el backend (`pnpm docker:stop && pnpm docker:up` en `backend/`) y
   confirma que las imágenes subidas siguen visibles.
9. Comprueba en http://localhost:3000/motos que la foto se ve en el sitio
   público.

## Criterios de aceptación (DoD)

- [ ] Se puede subir una imagen desde el panel y queda visible en `web`.
- [ ] Las imágenes sobreviven a recrear el contenedor del backend.
- [ ] Subir sin sesión válida es rechazado.
- [ ] Archivos no permitidos y archivos demasiado grandes se rechazan con un
      mensaje que dice qué pasó y qué hacer.
- [ ] Las URLs externas ya guardadas en motos siguen funcionando.
- [ ] `cms-admin/CLAUDE.md` ya no dice que no hay subida de imágenes.

## Riesgos / notas

- El almacenamiento local no sobrevive a recrear el droplet ni escala a varias
  instancias. Es la decisión tomada para este tamaño de proyecto; anotarla como
  deuda conocida en `docs/architecture/cms-admin.md`.
- Ojo con el límite de tamaño de body del proxy `/api/graphql` de `cms-admin`:
  la subida no debe pasar por ahí.
