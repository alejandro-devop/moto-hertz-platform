# Fase 2 — Puntos de atención

## Objetivo

Primera sección completa con el patrón: `service-point` administrable de punta a
punta, y `/puntos-atencion` del sitio público leyendo del backend en vez de un
JSON.

Es la sección más simple de las cuatro (formulario casi plano), así que sirve
para validar que el patrón de la Fase 0 funciona antes de aplicarlo a las
demás.

## Prerrequisitos

- Fase 0 completada (`docs/cms-plan/PATRON.md`).
- Fase 1 completada, o decisión explícita de seguir con URLs de imagen.

## Contexto: los datos que ya existen

La tabla `service_points` ya está creada y migrada
(`backend/src/shared/database/schema.ts`):

`id`, `slug`, `name`, `type`, `address`, `phone`, `whatsapp`, `email`,
`location` (jsonb), `hours` (jsonb), `services` (array), `featured`, `image`,
`createdAt`, `updatedAt`.

`web/src/data/service-points-mock.json` es la forma que el sitio espera hoy:
**leerlo antes de diseñar nada** y confirmar que las columnas cubren lo que la
página pinta. Si falta algo, es una migración nueva, no un apaño en el front.

## Pasos detallados

1. **Backend.** Replicar el patrón `motorcycle` para `service-point`: service
   con Drizzle, tipos, validadores Zod, módulo GraphQL (query pública de listado
   y por slug; mutaciones `Add`/`Edit`/`Remove` con `requireAuth`), registro en
   el schema y los resolvers, y tests del service.
2. **cms-admin.** Módulo `puntos-de-atencion` siguiendo `PATRON.md`. Sustituir
   el placeholder actual (`app/(admin)/puntos-de-atencion/page.tsx`).
   - Lista: nombre, tipo, dirección, teléfono, destacado.
   - Filtros: por tipo y por destacado. Búsqueda por nombre o dirección.
   - Ficha por secciones: **Identidad** (slug, nombre, tipo, imagen),
     **Contacto** (teléfono, WhatsApp, correo), **Ubicación** (dirección y las
     coordenadas de `location`), **Horarios** (editor para el jsonb `hours`,
     día por día, no un campo de texto crudo), **Servicios** (lista).
3. **web.** Servicio en `web/src/services/`, tipos, y `/puntos-atencion`
   consumiendo el backend. Borrar `web/src/data/service-points-mock.json`.
4. **Datos.** Cargar en el panel los puntos de atención reales que hoy están en
   el mock, para no perderlos al borrar el JSON.

## Entregables

- Dominio `service-point` completo en las tres capas.
- `web/src/data/service-points-mock.json` eliminado.

## Pruebas manuales

1. `pnpm dev` en la raíz.
2. En http://localhost:3001/puntos-de-atencion, crea un punto de atención con
   todos los campos, incluidos horarios y dos servicios.
3. Comprueba que aparece en la lista con su tipo y su teléfono.
4. Ábrelo de nuevo y verifica que **todos** los campos se recuperaron tal como
   los guardaste (especialmente horarios y la lista de servicios).
5. Edita el nombre y confirma que la lista se actualiza sin recargar.
6. Ve a http://localhost:3000/puntos-atencion y comprueba que el punto nuevo
   aparece en el sitio público.
7. Marca el punto como destacado en el panel y confirma que el sitio refleja el
   cambio al recargar.
8. Filtra por tipo en el panel y comprueba que la URL guarda el filtro.
9. A 390 px de ancho: la lista debe pasar a tarjetas y la ficha abrirse a
   pantalla completa con la barra de guardado abajo.
10. Elimina el punto de prueba y confirma que desaparece de los dos sitios.

## Criterios de aceptación (DoD)

- [ ] Crear, editar y eliminar funciona desde el panel y se refleja en `web`.
- [ ] Los horarios se editan con un control entendible, no como JSON crudo.
- [ ] Las mutaciones sin sesión son rechazadas por el backend.
- [ ] `service-points-mock.json` ya no existe y `/puntos-atencion` no lo importa.
- [ ] Los puntos de atención que estaban en el mock están cargados en la base.
- [ ] Tests del service de `service-point` pasan.
- [ ] `backend/CLAUDE.md` actualiza la tabla de dominios (`service-point` ✅).

## Riesgos / notas

- `hours` y `location` son `jsonb`: definir su forma en los validadores Zod y
  documentarla, o cada capa asumirá una distinta.
- Si el mock trae campos que la tabla no tiene, decidir con el usuario si se
  agregan (migración) o se descartan — no inventarlos en el front.
