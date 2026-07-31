# Fase 1 — Medios: subida de imágenes

## Objetivo

Reemplazar los campos de imagen de texto libre por una subida real desde el
panel. Es la única fase que no construye una sección del sitio, y va antes que
las demás para que puntos de atención, servicios, noticias y banners nazcan ya
con el selector de imágenes en vez de con URLs escritas a mano.

De paso deja puesto el **soft delete** (papelera) que el resto de las fases va a
heredar: si los archivos se pueden recuperar, los registros de contenido
también, y conviene que las cuatro secciones siguientes nazcan con esa regla en
vez de agregársela después.

## Prerrequisitos

- Fase 0 completada (`docs/cms-plan/PATRON.md` existe).
- `backend` corriendo en Docker con volumen persistente disponible.

## Contexto / decisiones previas

La Fase 3 del plan del monorepo había decidido «carpeta local del servidor, sin
servicio externo» (`docs/architecture/cms-admin.md`). **Al arrancar esta fase el
usuario amplió esa decisión**; lo que sigue reemplaza al paso 1 original y es
firme:

1. **Driver de almacenamiento, no carpeta a pelo.** Una interfaz de
   almacenamiento (`put` / `delete` / `url`) con el driver elegido por variable
   de entorno. En esta fase se implementa **solo el driver local** (carpeta en
   volumen Docker; es un droplet de DigitalOcean). S3 y GCP se añadirán el día
   que haya un bucket: la costura queda puesta y documentada, pero **no se
   escriben implementaciones muertas**.
2. **Procesado al subir, con `sharp`.** Se limita el lado mayor a ~1600 px, se
   convierte a WebP y **se guarda solo el resultado**: el original no se
   conserva. Una foto de teléfono son 4–8 MB y una moto lleva 16–18.
3. **Tabla `media`.** La papelera obliga a un registro de archivos: clave,
   URL pública, tipo, tamaño, dimensiones, fecha y `deletedAt`.
4. **Soft delete en medios y en contenido.**
   - `deletedAt` en `media` **y** en `motorcycles`, `service_points`,
     `services` y `news`, todo en la misma migración.
   - Comportamiento completo **solo donde hay capa de dominio hoy**
     (`motorcycle` y `media`): eliminar manda a papelera, las lecturas normales
     y públicas excluyen lo borrado, y hay listar papelera / restaurar /
     eliminar definitivamente (esto último sí borra el archivo).
   - `service_points`, `services` y `news` **solo reciben la columna**: todavía
     no tienen service ni GraphQL.
   - El patrón se escribe en `PATRON.md` para que las fases 2–6 nazcan con soft
     delete de serie. Eso es tan entregable como el código.
5. **Qué manda una imagen a la papelera: solo el borrado manual desde la
   biblioteca de medios.** Quitar una foto de una ficha **solo la desvincula**;
   eliminar una moto **no toca sus archivos**. No se construye rastreo de qué
   registro usa qué archivo.

Sigue vigente del planteamiento original: mantener la posibilidad de **pegar una
URL externa** (el catálogo legacy tiene imágenes alojadas fuera y no se pueden
romper), `accept="image/*"` para que en el teléfono abra la cámara, la subida
**no pasa por el proxy `/api/graphql`** de `cms-admin` (tiene su propio límite de
body), el endpoint va protegido con el mismo JWT que las mutaciones, y los
nombres de archivo no son adivinables.

Hoy una moto del sitio legacy trae entre 16 y 18 fotos, así que la subida
múltiple no es un extra, es el caso normal.

## Pasos detallados

1. **Backend — capa de almacenamiento.**
   - `src/shared/storage/`: la interfaz (`put`, `delete`, `url`, `exists`) y el
     **driver local**, que escribe bajo `MEDIA_ROOT` y arma la URL pública con
     `MEDIA_PUBLIC_BASE_URL`. `getStorage()` resuelve el driver desde
     `STORAGE_DRIVER`; cualquier otro valor falla al arrancar con un mensaje que
     dice qué falta.
   - Carpeta de subidas montada como **volumen nombrado** en
     `docker-compose.yml`, que sobrevive a recrear el contenedor.
   - Servir los archivos estáticamente bajo `/media/**` (solo con driver local).
   - Claves no adivinables, agrupadas por año/mes, extensión `.webp`.
2. **Backend — procesado de imagen.** `sharp` como dependencia nueva (nativa:
   hay que reconstruir la imagen de Docker). Redimensiona a 1600 px de lado
   mayor sin agrandar, convierte a WebP y devuelve buffer + ancho + alto.
   Rechaza lo que no sea imagen y lo que pase del tamaño máximo con un mensaje
   que diga qué pasó.
3. **Backend — tabla `media` y soft delete.** Una migración nueva
   (`006_*.sql`) con la tabla `media` y la columna `deleted_at` en las cuatro
   tablas de contenido, más sus índices parciales. `schema.ts` al día.
4. **Backend — dominio `media`.** Service, tipos, validadores Zod y módulo
   GraphQL: `mediaList(page, limit, q, trashed)`, `mediaRemove`, `mediaRestore`,
   `mediaPurge`. **Las queries de medios exigen sesión** (la biblioteca es una
   herramienta del panel, no contenido público) — es la excepción a la regla de
   «queries públicas» de `PATRON.md`.
5. **Backend — endpoint de subida.** `POST /api/media` multipart, protegido por
   el mismo JWT que las mutaciones (middleware Express que reusa
   `verifyAdminToken`). Un archivo por request, para poder mostrar progreso por
   foto.
6. **Backend — soft delete en `motorcycle`.** `motorcycleRemove` manda a
   papelera; `motorcycleRestore` y `motorcyclePurge` nuevas; todas las lecturas
   excluyen lo borrado salvo que se pida `trashed: true`. Eliminar una moto no
   toca sus archivos.
7. **cms-admin — componentes de imagen.**
   - `ImagePicker` (una sola imagen) y `GaleriaImagenes` (varias, reordenar,
     marcar portada), sobre el mismo motor de subida: arrastrar y soltar o
     elegir archivo, progreso por foto, vista previa, quitar.
   - `accept="image/*"` para que en móvil ofrezca cámara o galería.
   - Se mantiene el campo de **pegar URLs externas**.
   - La subida va por una ruta propia de `cms-admin` (`/api/media/upload`) que
     adjunta el JWT server-side. No pasa por `/api/graphql`.
8. **cms-admin — biblioteca de medios.** Sección nueva `/medios` siguiendo el
   patrón de módulo (lista responsive, filtros en la URL, acciones de fila):
   subir, copiar URL, abrir, eliminar (a papelera), y con el filtro **En
   papelera** restaurar o eliminar definitivamente.
9. **cms-admin — adopción en motos.** La sección «Fotos» de la ficha pasa a
   `GaleriaImagenes` sin perder las URLs ya guardadas, y la lista gana el estado
   **En papelera** con restaurar / eliminar definitivamente, reusando
   `BarraFiltros`.
10. **Documentación.** `cms-admin/CLAUDE.md` (sección «Gestión de medios»),
    `backend/CLAUDE.md` (almacenamiento y soft delete),
    `docs/architecture/cms-admin.md` y **`docs/cms-plan/PATRON.md`** (el patrón
    de soft delete y el de campos de imagen, para las fases 2–6).

## Entregables

- Interfaz de almacenamiento con driver local, y la receta escrita para agregar
  otro driver sin tocar el resto.
- Procesado a WebP ≤1600 px al subir.
- Tabla `media` + `deleted_at` en las cuatro tablas de contenido.
- Endpoint de subida autenticado y almacenamiento persistente.
- `ImagePicker` y `GaleriaImagenes` reutilizables.
- Biblioteca de medios con papelera.
- Ficha de moto usando la subida real; lista de motos con papelera.
- El patrón de soft delete escrito en `PATRON.md`.

## Pruebas manuales

1. `pnpm dev` en la raíz; entra a http://localhost:3001/motos.
2. Abre una moto → sección **Fotos** → arrastra una imagen desde tu escritorio.
   Debe verse el progreso y quedar la vista previa.
3. Guarda, recarga la página y comprueba que la imagen sigue ahí.
4. Sube tres imágenes más, reordénalas y marca una distinta como portada.
   Guarda y confirma que la portada cambió en la lista.
5. Pega una URL externa en el mismo panel y confirma que se agrega junto a las
   subidas.
6. Intenta subir un archivo que no sea imagen (por ejemplo un PDF): debe
   rechazarlo con un mensaje claro, sin romper el formulario.
7. Intenta subir una imagen por encima del límite: mismo trato.
8. Abre http://localhost:3001/medios: la imagen subida aparece en la
   biblioteca, con su tamaño y dimensiones ya reducidos (WebP).
9. Elimina una imagen desde la biblioteca → filtro **En papelera** → debe estar
   ahí; restáurala y vuelve a la lista normal.
10. Vuelve a eliminarla y usa **Eliminar definitivamente**: desaparece de la
    biblioteca y su URL deja de responder.
11. En /motos, elimina una moto → filtro **En papelera** → restáurala; vuelve a
    eliminarla y elimínala definitivamente.
12. Comprueba en http://localhost:3000/motos que la moto en papelera no sale en
    el sitio público y que la foto subida sí se ve.
13. Abre el panel desde el teléfono en la misma red y sube una foto con la
    cámara.
14. Reinicia el backend (`npm run docker:stop && npm run docker:up` en
    `backend/`) y confirma que las imágenes subidas siguen visibles.

## Criterios de aceptación (DoD)

- [ ] Se puede subir una imagen desde el panel y queda visible en `web`.
- [ ] Lo que se guarda es un WebP de ≤1600 px de lado mayor, no el original.
- [ ] Las imágenes sobreviven a recrear el contenedor del backend.
- [ ] Subir sin sesión válida es rechazado.
- [ ] Archivos no permitidos y archivos demasiado grandes se rechazan con un
      mensaje que dice qué pasó y qué hacer.
- [ ] Las URLs externas ya guardadas en motos siguen funcionando y se pueden
      seguir pegando.
- [ ] Eliminar una imagen la manda a la papelera; se puede restaurar; eliminar
      definitivamente borra también el archivo del almacenamiento.
- [ ] Eliminar una moto la manda a la papelera, desaparece del sitio público y
      se puede restaurar.
- [ ] Cambiar de driver de almacenamiento no exige tocar servicios ni
      resolvers: solo agregar un archivo y una variable de entorno, y está
      escrito dónde.
- [ ] `cms-admin/CLAUDE.md` ya no dice que no hay subida de imágenes.
- [ ] `docs/cms-plan/PATRON.md` explica el soft delete para las fases 2–6.

## Riesgos / notas

- El almacenamiento local no sobrevive a recrear el droplet ni escala a varias
  instancias. Es la decisión tomada para este tamaño de proyecto; el driver
  existe justamente para poder cambiarla sin reescribir nada.
- La URL pública se calcula al subir y se guarda tal cual en el contenido. Si
  cambia el dominio o el driver hay que reescribir esas URLs; la tabla `media`
  guarda la clave, así que es un `UPDATE` mecánico, pero hay que acordarse.
- Ojo con el límite de tamaño de body del proxy `/api/graphql` de `cms-admin`:
  la subida no pasa por ahí.
- `sharp` es una dependencia nativa: cambia el `npm install` dentro del
  contenedor y obliga a reconstruir la imagen.
