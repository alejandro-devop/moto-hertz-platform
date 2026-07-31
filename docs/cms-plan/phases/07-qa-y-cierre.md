# Fase 7 — QA y cierre del CMS

## Objetivo

Recorrer el CMS completo como lo haría quien lo va a usar todos los días,
arreglar lo que se rompió por el camino y dejar la documentación al día. No se
construyen secciones nuevas.

## Prerrequisitos

- Fases 0 a 6 completadas (o explícitamente saltadas con `goto`, y anotado).

## Pasos detallados

1. **Recorrido completo.** Con el sitio y el panel corriendo, crear, editar y
   eliminar un registro de **cada** sección, en escritorio y en móvil, en tema
   claro y oscuro. Anotar todo lo que chirríe, por pequeño que sea.
2. **Coherencia entre módulos.** Después de seis fases, es normal que las
   secciones hayan divergido. Revisar y unificar:
   - Los textos de los botones y de los avisos (una acción se llama igual en
     toda la aplicación).
   - Los estados de vacío, carga y error.
   - Qué se puede hacer desde el menú de acciones de cada fila.
   - Los mensajes de validación.
3. **Paridad escritorio/móvil.** Comprobar que toda acción de toda sección es
   alcanzable en las dos pantallas. Es el requisito que originó el rediseño del
   panel: verificarlo sección por sección, no de memoria.
4. **Accesibilidad básica.** Recorrer cada módulo solo con el teclado: llegar a
   todos los controles, ver siempre dónde está el foco, cerrar diálogos con
   `Escape`.
5. **Sin mocks.** Confirmar que `web/src/data/` ya no tiene JSON de contenido y
   que ninguna página lo importa.
6. **Rendimiento honesto.** Medir cuánto tarda la lista de cada sección con
   datos reales. La lista de motos trae el catálogo completo y filtra en el
   cliente: comprobar si alguna otra sección heredó ese enfoque y si el volumen
   real lo justifica.
7. **Documentación.**
   - `cms-admin/CLAUDE.md`: todos los módulos, sin "próximamente" que ya no
     apliquen.
   - `backend/CLAUDE.md`: tabla de dominios completa.
   - `docs/architecture/data-flow.md`: el flujo real, sin los diferidos que ya
     se resolvieron.
   - `docs/cms-plan/PATRON.md`: lo que se aprendió construyendo cinco módulos.
8. **Deuda conocida.** Volcar en `docs/cms-plan/MEJORAS.md` lo que quedó
   pendiente a propósito, con el porqué. Un pendiente escrito es una decisión;
   uno no escrito es un olvido. **No crear un `DEUDA.md` aparte**: `MEJORAS.md`
   es la única lista de pendientes del proyecto y ya existe.

## Entregables

- Lista de hallazgos del recorrido, con los que se arreglaron marcados.
- Documentación al día en los cuatro archivos.
- `docs/cms-plan/MEJORAS.md` al día con lo que se decidió no arreglar.

## Pruebas manuales

Este es el guion completo. Recórrelo entero: es la prueba de aceptación del CMS.

1. `pnpm dev` en la raíz. Entra a http://localhost:3001 y haz login.
2. **Por cada sección** (motos, puntos de atención, servicios, noticias,
   banners): crea un registro completo, míralo en http://localhost:3000,
   edítalo, comprueba el cambio en el sitio, y elimínalo.
3. Repite el paso 2 en el teléfono, con la misma sección que más te cueste.
4. Entra a **Configuración**, cambia un dato de contacto y compruébalo en el
   sitio.
5. Sube una imagen en cada sección que las tenga y confirma que se ve en `web`.
6. Recorre el panel entero con `Tab`: comprueba que siempre ves dónde está el
   foco y que puedes llegar a todo.
7. Cambia a tema oscuro y repasa las cinco listas y una ficha de cada una.
8. Apaga el backend y recorre el panel: cada sección debe mostrar un error que
   diga qué pasó, no una pantalla en blanco ni un volcado técnico.
9. Vuelve a encenderlo y comprueba que "Reintentar" funciona en cada sección.

## Criterios de aceptación (DoD)

- [ ] El guion de pruebas manuales se recorrió entero y los hallazgos están
      anotados.
- [ ] Todo hallazgo está arreglado o registrado en `MEJORAS.md` con su porqué.
- [ ] Ninguna sección tiene acciones que solo existan en escritorio.
- [ ] `web/src/data/` no contiene JSON de contenido.
- [ ] Los cuatro documentos están al día.
- [ ] `pnpm --filter yamaha-oriente-cms-admin build` y los tests del backend
      pasan.
- [ ] El usuario recorrió el guion por su cuenta y lo dio por bueno.

## Riesgos / notas

- La tentación de esta fase es arreglar todo lo que se encuentre. Separar lo que
  molesta de verdad en el uso diario de lo que es preferencia: lo segundo va a
  `MEJORAS.md`.
