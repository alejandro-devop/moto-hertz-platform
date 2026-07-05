# Fase 8 — QA y documentación final

## Objetivo

Cerrar el proyecto con una pasada de calidad general y documentación completa del monorepo para futuros mantenedores.

## Prerrequisitos

- Fase 7 completada (todo desplegado).

## Pasos detallados

1. Revisión de cobertura de tests en `backend` (mínimo 70%, según convención heredada de xavi-platform-node).
2. Revisión de accesibilidad y performance básica de `web` (Lighthouse, Core Web Vitals).
3. Revisión de seguridad básica: variables sensibles no expuestas, CORS configurado correctamente entre `web`/`cms-admin` y `backend`, rate limiting si aplica.
4. Consolidar documentación: `README.md` raíz, `docs/PLAN.md` marcado como completado, `docs/architecture/` con los documentos de decisión generados en fases anteriores (cms-admin, data-flow).
5. Checklist de handoff: cómo correr todo en local, cómo desplegar, cómo añadir un nuevo dominio de contenido (patrón a seguir en backend + cms-admin + web).

## Entregables

- Documentación de handoff completa.
- Reporte de QA (tests, performance, seguridad).

## Criterios de aceptación (DoD)

- [ ] Toda la documentación de `docs/` está actualizada y sin secciones "pendiente de decidir" abiertas.
- [ ] Usuario da el visto bueno final del proyecto.

## Riesgos / notas

- Ninguno; fase de cierre.
