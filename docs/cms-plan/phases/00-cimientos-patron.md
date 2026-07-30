# Fase 0 — Cimientos del patrón CMS

## Objetivo

Extraer de `cms-admin/app/(admin)/motos/` las piezas que se van a repetir en
todas las secciones, y dejar escrita la receta para construir un módulo nuevo.
Sin esto, las cuatro secciones siguientes duplican el mismo código.

## Prerrequisitos

- El módulo `motos` funciona (lista, filtros, ficha, acciones) — cerrado en el
  rediseño del admin.
- `backend` expone `motorcycle` completo como referencia de patrón.

## Pasos detallados

1. Revisar `cms-admin/app/(admin)/motos/` e identificar qué es genérico y qué es
   propio de motos. Candidatos claros a extraer:
   - Lectura y escritura de filtros en `searchParams` (`filters.ts` tiene la
     mecánica de `leerFiltros` / `escribirFiltros` / `paginar` mezclada con los
     filtros concretos de motos).
   - El componente `Paginacion` de `page.tsx`.
   - La estructura "tabla en escritorio / tarjetas en móvil" de
     `motorcycle-row.tsx`.
   - El armazón de la ficha (`Sheet` + secciones + barra de guardado fija) de
     `motorcycle-form-sheet.tsx`, junto con `Field`, `ToggleRow` y `Grid`.
2. Mover lo genérico a `cms-admin/components/admin/` y `cms-admin/lib/`, dejando
   en `motos/` solo lo específico del dominio.
   - **Extraer solo lo que ya se repite o se va a repetir con certeza.** Una
     abstracción prematura cuesta más que la duplicación que evita.
3. Escribir `docs/cms-plan/PATRON.md`: la receta paso a paso de un módulo nuevo,
   en las tres capas, con `motorcycle` / `motos` como ejemplo vivo y enlaces a
   los archivos concretos.
   - Capa backend: tabla en `schema.ts` → migración → `<dominio>.service.ts` →
     `types/services/<dominio>.types.ts` → `validators/schemas/<dominio>.schemas.ts`
     → `graphql/modules/<dominio>/` (schema + resolvers con `requireAuth` en las
     mutaciones) → registro en `graphql/schema.ts` y `graphql/resolvers.ts` →
     tests.
   - Capa cms-admin: `lib/graphql/<dominio>.ts` → `app/(admin)/<ruta>/` con los
     archivos del patrón (`filters.ts`, `use-<dominio>.ts`, `page.tsx`,
     `<x>-row.tsx`, `<x>-actions.tsx`, `<x>-form-sheet.tsx`,
     `<x>-form-state.ts`) → entrada en `nav-links.ts`.
   - Capa web: servicio en `web/src/services/` → tipos → reemplazar el import
     del mock en la página → borrar el JSON de `web/src/data/`.
4. Verificar que `motos` sigue comportándose exactamente igual tras la
   extracción: lista, filtros, orden, paginación, ficha, acciones, tema claro y
   oscuro, escritorio y móvil.

## Entregables

- Piezas compartidas en `cms-admin/components/admin/` y `cms-admin/lib/`.
- `docs/cms-plan/PATRON.md` con la receta completa.
- `motos` refactorizado sobre esas piezas, sin cambios de comportamiento.

## Pruebas manuales

1. `pnpm dev` en la raíz y entra a http://localhost:3001/motos.
2. Comprueba que la lista se ve igual que antes: miniatura, papeles, precio,
   estado de publicación.
3. Escribe algo en el buscador y confirma que la URL cambia a `?q=…` y que al
   recargar el filtro sigue puesto.
4. Cambia un filtro y el orden; comprueba que la paginación vuelve a la página 1.
5. Abre una moto, cambia un campo, cierra sin guardar y confirma que pregunta
   antes de descartar.
6. Reduce la ventana a 390 px de ancho: la tabla debe convertirse en tarjetas y
   la barra inferior de navegación debe aparecer.
7. Cambia entre tema claro y oscuro desde la barra superior.

## Criterios de aceptación (DoD)

- [ ] `pnpm --filter yamaha-oriente-cms-admin build` compila sin errores.
- [ ] `motos` pasa las siete pruebas manuales sin ninguna diferencia respecto a
      antes de la fase.
- [ ] `docs/cms-plan/PATRON.md` existe y describe las tres capas con enlaces a
      archivos reales.
- [ ] Ninguna pieza extraída quedó sin usar (`motos` las consume todas).

## Riesgos / notas

- El riesgo real de esta fase es sobre-abstraer. Si una pieza solo sirve para
  motos, déjala en `motos/` y anótalo en `PATRON.md` como decisión consciente.
- Esta fase no toca `backend` ni `web`.
