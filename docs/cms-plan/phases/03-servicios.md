# Fase 3 — Servicios

## Objetivo

`service` administrable de punta a punta y `/servicios` del sitio público
leyendo del backend.

## Prerrequisitos

- Fase 2 completada (el patrón ya se validó con una sección real).
- `services` **ya tiene la columna `deleted_at`** (migración `006` de la Fase 1).
  La papelera se implementa aquí siguiendo `PATRON.md` §1.1, igual que en la
  Fase 2; **no hay migración nueva para eso**.

## Alcance acordado con el usuario

> Decidido **antes** de construir. Reemplaza lo que diga el resto del documento
> donde haya conflicto.

**1. `pricing` soporta tres modalidades**, elegidas con un selector en la ficha:
`DESDE` (monto), `FIJO` (monto) y `A_CONVENIR` (sin monto). Moneda fija en COP.
Una nota libre opcional para lo que hoy es `frequency` («cada 5.000 km», «una
vez al año»). La forma se define en el validador Zod y se documenta, porque las
tres capas la leen.

**2. `image`, `featured` e `icon` se quedan los tres.** A diferencia de la Fase
2, aquí no se recorta nada: imagen elegida con el selector de la Fase 1, filtro
por destacado en la lista, e icono de catálogo cerrado.

**3. El icono sale de `lucide-react`**, que ya usan `cms-admin` y `web`. Una
lista acotada de iconos relevantes para taller y servicio, con vista previa en
el selector. Dónde se amplía la lista queda documentado en el código. **Los
emojis del mock no se conservan.**

**4. NO se siembran datos.** El sitio de referencia
<https://www.incolmotos-yamaha.com.co/servicios-yamaha> se usa para **derivar
qué campos y qué estructura tiene un servicio de verdad**, no como fuente de
carga. Los seis servicios del mock son de plantilla y **no se cargan**. La
sección arranca vacía y el usuario carga los servicios reales desde el panel.

Consecuencia directa: **`/servicios` tiene que verse bien sin datos.** Un estado
vacío explícito en el sitio público, no una página rota ni una rejilla en
blanco. Lo mismo en la lista del panel.

## Contexto: los datos que ya existen

Tabla `services` (`backend/src/shared/database/schema.ts`):

`id`, `slug`, `name`, `category`, `shortDescription`, `fullDescription`, `icon`,
`features` (array), `benefits` (array), `pricing` (jsonb), `duration`,
`featured`, `image`, `createdAt`, `updatedAt`.

`web/src/data/services-mock.json` define lo que la página espera hoy — leerlo
antes de diseñar la ficha.

Lo que distingue esta sección de la anterior son **las listas anidadas**
(`features`, `benefits`) y **`pricing`**, que es un jsonb con forma propia.

## Pasos detallados

1. **Backend.** Patrón completo para `service`: service con Drizzle, tipos,
   validadores Zod (incluida la forma de `pricing`), módulo GraphQL con query
   pública y mutaciones con `requireAuth`, registro y tests.
2. **cms-admin.** Módulo `servicios` sustituyendo el placeholder
   (`app/(admin)/servicios/page.tsx`).
   - Lista: nombre, categoría, duración, destacado.
   - Filtros: por categoría y destacado. Búsqueda por nombre.
   - Ficha por secciones: **Identidad** (slug, nombre, categoría, icono,
     imagen), **Descripción** (corta y larga), **Qué incluye** (`features` y
     `benefits` como listas editables — agregar, quitar, reordenar, no un campo
     de texto separado por comas), **Precio y duración** (`pricing`, `duration`).
   - `icon` viene de un catálogo cerrado: ofrecer un selector con vista previa
     del icono, no un campo de texto donde haya que acertar el nombre.
3. **web.** Servicio, tipos y `/servicios` consumiendo el backend, **con estado
   vacío digno**. Borrar `web/src/data/services-mock.json`.
4. **Referencia de estructura.** Revisar
   <https://www.incolmotos-yamaha.com.co/servicios-yamaha> para contrastar los
   campos de la ficha contra cómo se presenta un servicio de verdad, y reportar
   al cerrar qué se ajustó a raíz de eso. **Sin sembrar datos.**

## Entregables

- Dominio `service` completo en las tres capas.
- Editor de listas reutilizable (lo van a necesitar noticias y banners).
- `web/src/data/services-mock.json` eliminado.

## Pruebas manuales

1. `pnpm dev` en la raíz.
2. En http://localhost:3001/servicios, crea un servicio con tres `features` y
   dos `benefits`.
3. Reordena las `features` (mueve la tercera al primer lugar) y guarda.
4. Reabre la ficha y confirma que el orden se conservó.
5. Elige un icono desde el selector y comprueba que se ve la vista previa.
6. Ve a http://localhost:3000/servicios y confirma que el servicio aparece con
   sus features en el orden que definiste.
7. Cambia la descripción corta en el panel y verifica el cambio en el sitio.
8. Filtra por categoría en el panel; comprueba que el filtro queda en la URL y
   sobrevive a recargar.
9. A 390 px: lista en tarjetas, ficha a pantalla completa, listas editables
   usables con el pulgar.
10. Elimina el servicio de prueba y confirma que desaparece de los dos sitios.

## Criterios de aceptación (DoD)

- [ ] Crear, editar y eliminar funciona y se refleja en `web`.
- [ ] `features` y `benefits` se editan como listas con orden, no como texto
      separado por comas.
- [ ] El icono se elige de un catálogo con vista previa.
- [ ] `services-mock.json` ya no existe y `/servicios` no lo importa.
- [ ] Sin ningún servicio en la base, `/servicios` y la lista del panel muestran
      un estado vacío explícito, no una página rota.
- [ ] `pricing` soporta desde / fijo / a convenir, y las tres se ven bien en el
      sitio.
- [ ] La papelera funciona completa: eliminar → restaurar → eliminar
      definitivamente, desde el filtro de estado.
- [ ] Tests del service de `service` pasan.
- [ ] `backend/CLAUDE.md` actualiza la tabla de dominios (`service` ✅).

## Riesgos / notas

- El editor de listas es la pieza reutilizable de esta fase: dejarlo en
  `cms-admin/components/admin/` y anotarlo en `PATRON.md`.
- `pricing` puede tener formas distintas (precio fijo, desde, a convenir).
  Definirlo con el usuario antes de codificar el validador.
