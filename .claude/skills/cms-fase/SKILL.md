---
name: cms-fase
description: Ejecuta fase por fase el plan de construcción del CMS de moto-hertz-platform (docs/cms-plan/) — la administración de puntos de atención, servicios, noticias, banners, configuración y medios. Delega la construcción en el subagente cms-seccion y entrega los pasos de prueba manual al cerrar cada fase. Usar cuando el usuario invoque /cms-fase.
---

# Skill: cms-fase

Gestiona la ejecución del plan documentado en `docs/cms-plan/PLAN.md` y
`docs/cms-plan/phases/*.md`: construir la administración de las secciones del
sitio que todavía no se pueden editar desde `cms-admin`.

El trabajo pesado lo hace el subagente **`cms-seccion`**
(`.claude/agents/cms-seccion.md`). Esta skill lleva la memoria del plan, decide
qué fase toca, lanza al subagente y cierra la fase con el usuario.

**No la confundas con `yamaha-fase`**, que ejecuta otro plan (el del monorepo,
`docs/PLAN.md`) con otro archivo de estado. Son independientes.

## Archivos

- Estado: `.claude/state/cms-phase-state.json` — fuente de verdad.
- Índice del plan: `docs/cms-plan/PLAN.md`.
- Documento de cada fase: `docs/cms-plan/phases/NN-nombre.md`.
- Receta de módulo: `docs/cms-plan/PATRON.md` (la crea la Fase 0).

## Argumentos (`args`)

- *(sin argumentos)* → ejecutar la fase actual.
- `status` → mostrar en qué fase vamos y cuál sigue, sin ejecutar nada.
- `goto <N>` → saltar a la fase N. Pide confirmación explícita.
- `reset` → reiniciar el progreso. Pide confirmación explícita.

## Al invocarse, siempre

1. Lee `.claude/state/cms-phase-state.json`.
2. Empieza tu respuesta con una línea: qué fase es la actual y qué vas a hacer.
3. Si el argumento fue `status`, muestra fase actual, cuántas completadas de
   cuántas, qué sigue, y las decisiones del `log` que condicionan lo que viene.
   Detente ahí.

## Ejecutar una fase

1. **Lee tú mismo el documento de la fase** antes de delegar. Necesitas saber
   qué pediste para poder juzgar lo que te devuelvan.
2. Verifica los prerrequisitos contra el estado. Si una fase anterior no está
   `completed`, avisa y detente — salvo que el usuario haya hecho `goto`
   explícito.
3. **Si el documento marca decisiones "a confirmar con el usuario"** (la Fase 5
   tiene una sobre el alcance de la home; la Fase 4, sobre el formato del
   contenido), resuélvelas **antes** de lanzar al subagente. Pregunta con
   opciones concretas y sus consecuencias. El subagente no debe encontrarse
   bloqueado a mitad de camino por algo que se podía decidir antes.
4. Lanza el subagente con la herramienta Agent, `subagent_type: "cms-seccion"`,
   en primer plano (`run_in_background: false`): necesitas su resultado para
   cerrar la fase.

   En el prompt, dale: el número y nombre de la fase, la ruta de su documento,
   las decisiones que acabas de resolver con el usuario, y cualquier cosa
   relevante del `log` de fases anteriores. **No le copies el documento entero**
   — sabe leerlo, y la ruta es suficiente.

5. Cuando termine, revisa su reporte con ojo crítico. Un subagente puede
   reportar como hecho algo que no verificó. Comprueba tú lo que sea barato de
   comprobar: que los archivos existen, que el build pasa, que el estado quedó
   consistente. **No repitas al usuario afirmaciones del subagente que no
   puedas respaldar.**

6. **Entrégale al usuario los pasos de prueba manual.** Es el entregable que él
   pidió explícitamente y no puede faltar en ninguna fase. Preséntalos como una
   lista numerada, con URLs y datos concretos, y con lo que debería ocurrir en
   cada paso. Si el reporte del subagente los trae flojos o genéricos,
   reescríbelos tú a partir del documento de fase y de lo que se construyó.

7. Repasa con el usuario los **criterios de aceptación (DoD)** del documento,
   uno por uno. No cierres la fase sin este repaso.

8. **Cierra la fase solo si el usuario confirma** que corrió las pruebas y que
   los criterios se cumplen:
   - `status: "completed"` en esa fase.
   - Entrada nueva en `log`: `{ "phase": N, "completed_at": "<ISO de hoy>",
     "notes": "<qué se construyó, qué se decidió y qué quedó pendiente>" }`.
     Las notas son la memoria del plan: escríbelas para que dentro de dos meses
     alguien entienda por qué las cosas están como están, no como un resumen
     de relleno.
   - `current_phase` a la siguiente. Si era la 7, déjala en 7 y di que el plan
     está completo.

9. Si algún criterio no se cumple: deja la fase en `in_progress`, no avances
   `current_phase`, y dile al usuario exactamente qué falta.

## `goto <N>`

Confirma con el usuario, advirtiendo qué fases intermedias quedan sin hacer.
Si confirma, cambia `current_phase` a N. **No marques las intermedias como
completadas** — quedan como estaban, y eso es información valiosa.

## `reset`

Es destructivo sobre el progreso registrado: confirma explícitamente. Si
confirma, `current_phase: 0`, todas las fases en `pending`, `log: []`.

## Estilo

- Una línea de resumen al abrir. Sin preámbulos.
- No repitas el documento de fase en la respuesta: existe, y el usuario puede
  abrirlo.
- Los pasos de prueba manual sí van completos en la respuesta, aunque estén en
  el documento. Son lo que el usuario va a hacer a continuación.
- Si el subagente falló o dejó la fase a medias, dilo en la primera línea. No
  lo entierres al final de un reporte optimista.
