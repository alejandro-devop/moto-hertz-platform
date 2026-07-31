# Fase 2 — Puntos de atención

## Objetivo

Primera sección completa con el patrón: `service-point` administrable de punta a
punta, y `/puntos-atencion` del sitio público leyendo del backend en vez de un
JSON.

Es la sección más simple de las cuatro (formulario casi plano), así que sirve
para validar que el patrón de la Fase 0 (`PATRON.md`) funciona antes de
aplicarlo a las demás.

## Prerrequisitos

- Fase 0 completada (`docs/cms-plan/PATRON.md`).
- Fase 1 completada — `service_points` **ya tiene la columna `deleted_at`**
  (migración `006`). El comportamiento de papelera se implementa en esta fase
  siguiendo `PATRON.md` §1.1; **no hay migración nueva**.

## Alcance acordado con el usuario

> Decidido **antes** de construir. El documento original describía una sección
> con más campos de los que el usuario quiere; esto lo reemplaza.

**1. Los campos de un punto de atención son:** nombre, dirección, teléfono,
correo, WhatsApp, horarios y ubicación — más `slug` y `type`.

- **Se van `services`, `image` y `featured`.** No entran en la ficha, no se
  exponen en GraphQL, y se **quitan de la página pública**
  (`web/src/app/puntos-atencion/page.tsx` y su `PuntosAtencion.module.scss`,
  que hoy pintan la foto, la insignia de destacado y la lista de servicios).
- Las columnas `services`, `image` y `featured` **se quedan en la tabla sin
  usar**: no se migra nada para borrarlas.
- Como `featured` desaparece, **el filtro «por destacado» también**. La lista
  filtra **por tipo**, con búsqueda por nombre o dirección.
- **Los horarios se quedan** y se editan **día por día** con un control
  entendible (DoD), no como JSON crudo.

**2. `type` es un catálogo cerrado**, no texto libre: desplegable en la ficha y
filtro fiable en la lista. Los valores se derivan de lo que usa el sitio
legacy (punto 4). Dónde se amplía queda documentado en el código.

**3. La ubicación se captura pegando el enlace de Google Maps.** Un campo de
URL, que es lo que de verdad se puede llenar sin ir a buscar coordenadas.
Se **extraen latitud y longitud del enlace cuando vengan en él** (`@lat,lng`,
`!3dlat!4dlng`, `q=lat,lng`), para que el sitio pueda pintar un mapa
incrustado; si el enlace no las trae, se guarda solo la URL y el sitio ofrece
«Cómo llegar» sin mapa. Todo va dentro del `location` jsonb que ya existe
(`{ mapsUrl, lat?, lng? }`), con su forma definida en el validador Zod.

**4. Los datos reales salen de motoshotwheels.com.** Los 8 puntos del mock son
de plantilla (concesionarios Yamaha en 8 ciudades) y **no se cargan**. Se
cargan los puntos reales del sitio legacy. Lo que el legacy no publique **no se
inventa**: se deja vacío y se reporta para que el usuario lo complete.

## Contexto: los datos que ya existen

La tabla `service_points` ya está creada y migrada
(`backend/src/shared/database/schema.ts`):

`id`, `slug`, `name`, `type`, `address` (jsonb), `phone`, `whatsapp`, `email`,
`location` (jsonb), `hours` (jsonb), `services` (sin usar), `featured` (sin
usar), `image` (sin usar), `createdAt`, `updatedAt`, `deletedAt`.

`web/src/data/service-points-mock.json` es la forma que el sitio espera hoy:
sirve para saber qué pinta la página, no como fuente de datos.

## Pasos detallados

1. **Backend.** Replicar el patrón `motorcycle` para `service-point`: service
   con Drizzle, tipos, validadores Zod, módulo GraphQL (query pública de listado
   y por slug; mutaciones `Add`/`Edit`/`Remove`/`Restore`/`Purge` con
   `requireAuth`), registro en el schema y los resolvers, y tests del service.
   - **Papelera completa** según `PATRON.md` §1.1, sin migración nueva.
   - Un extractor de coordenadas del enlace de Google Maps, con sus tests.
2. **cms-admin.** Módulo `puntos-de-atencion` siguiendo `PATRON.md`. Sustituir
   el placeholder actual (`app/(admin)/puntos-de-atencion/page.tsx`).
   - Lista: nombre, tipo, dirección, teléfono y horarios.
   - Filtros: **estado** (en el sitio / en papelera) y **tipo**. Búsqueda por
     nombre o dirección. Todo en la URL.
   - Ficha por secciones: **Identidad** (nombre, slug, tipo), **Contacto**
     (teléfono, WhatsApp, correo), **Ubicación** (dirección y enlace de Google
     Maps), **Horarios** (editor día por día para el jsonb `hours`).
3. **web.** Tipos y servicio en `web/src/`, y `/puntos-atencion` consumiendo el
   backend. Sin foto, sin insignia de destacado y sin lista de servicios; con
   mapa incrustado cuando el punto tenga coordenadas. Borrar
   `web/src/data/service-points-mock.json`.
4. **Datos.** Cargar los puntos de atención **reales** de motoshotwheels.com.

## Entregables

- Dominio `service-point` completo en las tres capas, con papelera.
- `web/src/data/service-points-mock.json` eliminado.
- Los puntos reales del sitio legacy cargados, con el reporte de qué dato faltó.

## Pruebas manuales

1. `pnpm dev` en la raíz (backend arriba con `npm run docker:up`).
2. En http://localhost:3001/puntos-de-atencion, crea un punto de atención con
   todos los campos, incluidos los horarios de dos días y un enlace de Google
   Maps con coordenadas.
3. Comprueba que aparece en la lista con su tipo, su dirección y su teléfono.
4. Ábrelo de nuevo y verifica que **todos** los campos se recuperaron tal como
   los guardaste (especialmente los horarios).
5. Edita el nombre y confirma que la lista se actualiza sin recargar.
6. Ve a http://localhost:3000/puntos-atencion y comprueba que el punto nuevo
   aparece en el sitio público, con sus horarios y su mapa.
7. Cambia el **tipo** del punto en el panel y confirma que el sitio lo refleja
   al recargar.
8. Filtra por tipo en el panel y comprueba que la URL guarda el filtro y que
   sobrevive a un `F5`.
9. A 390 px de ancho: la lista debe pasar a tarjetas y la ficha abrirse a
   pantalla completa con la barra de guardado abajo.
10. Elimina el punto de prueba: desaparece del sitio, aparece en el filtro
    **En papelera**, se puede **restaurar**, y desde la papelera se puede
    **eliminar definitivamente**.

## Criterios de aceptación (DoD)

- [ ] Crear, editar y eliminar funciona desde el panel y se refleja en `web`.
- [ ] Los horarios se editan con un control entendible, no como JSON crudo.
- [ ] La papelera funciona completa: eliminar → restaurar → eliminar
      definitivamente, desde el filtro de estado.
- [ ] El tipo es un catálogo cerrado en la ficha y filtra la lista.
- [ ] El enlace de Google Maps se guarda y, cuando trae coordenadas, el sitio
      pinta el mapa; cuando no, ofrece «Cómo llegar» sin mapa.
- [ ] Las mutaciones sin sesión son rechazadas por el backend.
- [ ] `service-points-mock.json` ya no existe y `/puntos-atencion` no lo importa.
- [ ] La página pública ya no muestra foto, destacado ni lista de servicios.
- [ ] Los puntos de atención reales del sitio legacy están cargados, y lo que
      faltó está reportado (no inventado).
- [ ] Tests del service de `service-point` pasan.
- [ ] `backend/CLAUDE.md` actualiza la tabla de dominios (`service-point` ✅) y
      `cms-admin/CLAUDE.md` recoge las decisiones del módulo.

## Riesgos / notas

- `hours` y `location` son `jsonb`: su forma se define en los validadores Zod y
  se documenta, o cada capa asumirá una distinta.
- El sitio legacy no publica correos ni horario por sede: esos campos quedan
  vacíos a propósito. Un teléfono inventado es peor que un teléfono ausente.
