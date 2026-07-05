---
name: yamaha-fase
description: Ejecuta la siguiente fase pendiente del plan de construcción de yamaha-oriente-platform (monorepo web + backend + cms-admin), o consulta/gestiona el estado del plan. Usar cuando el usuario invoque /yamaha-fase dentro de este proyecto.
---

# Skill: yamaha-fase

Esta skill gestiona la ejecución fase por fase del plan documentado en `docs/PLAN.md` y `docs/phases/*.md` del proyecto `yamaha-oriente-platform`. El estado persiste en `.claude/state/phase-state.json`.

## Archivos relevantes

- Estado: `.claude/state/phase-state.json` (fuente de verdad de en qué fase vamos).
- Índice del plan: `docs/PLAN.md`.
- Documentos de cada fase: `docs/phases/NN-nombre.md`.

## Argumentos (`args`)

- Sin argumentos → continuar/ejecutar la fase actual (`current_phase`).
- `status` → solo mostrar el estado actual (fase actual, fases completadas, próximas), sin ejecutar nada.
- `goto <N>` → saltar manualmente a la fase N (pide confirmación explícita al usuario antes de cambiar el estado, ya que puede saltarse pasos).
- `reset` → reinicia todo el estado a la fase 0 con todas las fases en `pending` (acción destructiva sobre el archivo de estado — pedir confirmación explícita antes de ejecutar).

## Procedimiento al invocarse (caso sin argumentos o `status`)

1. Leer `.claude/state/phase-state.json`.
2. Identificar `current_phase` y su entrada en `phases` (nombre, doc, status).
3. Mostrarle al usuario un resumen breve: fase actual, cuántas fases completadas de cuántas totales, y qué fase sigue.
4. Si el argumento fue `status`, detenerse aquí — no ejecutar nada más.

## Procedimiento para ejecutar una fase (caso sin argumentos, continuando)

1. Abrir el documento de la fase actual (`docs/phases/NN-*.md`) y leerlo completo.
2. Si `status` de esa fase es `pending`, marcarla como `in_progress` en el JSON de estado (actualizar el archivo ya en este punto, para dejar rastro aunque la sesión se corte a mitad de fase).
3. Verificar los "Prerrequisitos" del documento. Si no se cumplen (ej. una fase anterior no está `completed`), avisar al usuario y detenerse — no ejecutar fuera de orden salvo `goto` explícito.
4. Ejecutar los "Pasos detallados" del documento uno por uno:
   - Actuar como en cualquier tarea normal de ingeniería: usar las herramientas de archivo/shell disponibles, crear/editar código real, correr comandos.
   - Respetar las reglas globales de la sesión sobre acciones riesgosas o irreversibles (ej. `git push`, aprovisionar infraestructura en la nube con costo, borrar datos): confirmar con el usuario antes de ejecutarlas, aunque el documento de fase las liste como paso — el documento describe el plan, no una autorización previa para acciones de alto impacto.
   - Si un paso requiere una decisión que el documento marca como "pendiente"/"a confirmar con el usuario" (esto es especialmente cierto en la Fase 3, que es puramente conversacional), detenerse y preguntar antes de continuar — no asumir la decisión por el usuario.
5. Al terminar los pasos, revisar la lista de "Criterios de aceptación (DoD)" del documento uno por uno con el usuario. No marcar la fase como completada sin repasar explícitamente esta lista.
6. Si todos los criterios se cumplen y el usuario confirma:
   - Actualizar `.claude/state/phase-state.json`:
     - Marcar la fase actual como `status: "completed"`.
     - Añadir una entrada al array `log` con `{ "phase": N, "completed_at": "<fecha actual ISO>", "notes": "<resumen breve de lo hecho o decisiones tomadas>" }`.
     - Incrementar `current_phase` a la siguiente fase (si existe). Si la fase completada era la última (8), dejar `current_phase` en 8 pero indicar en el resumen que el proyecto está completo.
   - Informar al usuario del cierre de la fase y cuál es la siguiente.
7. Si algún criterio de aceptación NO se cumple, dejar la fase en `in_progress`, documentar en el resumen al usuario qué falta, y no avanzar `current_phase`.

## Procedimiento para `goto <N>`

1. Confirmar explícitamente con el usuario que quiere saltar de la fase actual a la fase N, advirtiendo si hay fases intermedias no completadas.
2. Si confirma, actualizar `current_phase` a N en el estado (sin tocar el `status` de las fases intermedias, que quedan como estaban — no marcarlas como completadas automáticamente).

## Procedimiento para `reset`

1. Confirmar explícitamente con el usuario (acción destructiva sobre el progreso registrado).
2. Si confirma, reescribir `.claude/state/phase-state.json` con `current_phase: 0`, todas las fases en `status: "pending"`, y `log: []`.

## Notas de estilo

- Cada vez que se invoque esta skill, empezar la respuesta con un resumen de una línea: fase actual y qué se va a hacer ahora (ejecutar, mostrar estado, saltar, o resetear).
- No repetir el contenido completo del documento de fase en la respuesta al usuario — resumir lo esencial, el documento ya existe como referencia.
