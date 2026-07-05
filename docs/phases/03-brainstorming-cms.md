# Fase 3 — Brainstorming de arquitectura del `cms-admin`

## Objetivo

Decidir, junto con el usuario, la arquitectura del headless CMS admin (`cms-admin`) que administrará el contenido del sitio (motos, servicios, noticias, puntos de atención, etc.) a través del `backend` propio.

## Prerrequisitos

- Fase 2 completada (o al menos el modelo de dominios del backend definido), para saber qué entidades debe administrar el CMS.

## Contexto

No hay plantilla previa para este paquete — a diferencia de `web` y `backend`, aquí el punto de partida es una discusión de opciones, no una copia de código.

## Preguntas a resolver con el usuario (esta fase es conversacional, no de código)

1. **Build vs. adoptar**:
   - Opción A: CMS admin **custom**, construido a medida (ej. Next.js/React admin panel) que habla directamente con el GraphQL del `backend` propio. Máximo control, más esfuerzo de desarrollo.
   - Opción B: Adoptar un headless CMS existente open-source auto-hospedado que se integre con el `backend` (ej. como capa de admin sobre las mismas tablas, o como servicio independiente que el `backend` consume/sincroniza).
   - Opción C: Usar el `backend` propio solo como fuente de verdad de datos, y el "CMS" es simplemente un admin panel delgado (CRUD generado) sobre el schema de Drizzle ya definido.
2. **Alcance de contenido a administrar**: confirmar la lista completa de entidades (motos, specs, precios, imágenes, servicios, puntos de atención, noticias, banners de home, configuración de sitio, SEO, etc.).
3. **Autenticación/roles**: ¿un solo admin, o roles distintos (editor, admin, super-admin)? ¿reutiliza el sistema de auth del `backend` o tiene el suyo?
4. **Gestión de medios**: ¿dónde se suben/almacenan imágenes de motos, noticias, etc.? (ej. Cloud Storage, Cloudinary, S3-compatible) — impacta el diseño del CMS y del backend.
5. **Stack del CMS**: si se decide construir custom (Opción A), ¿qué stack? Recomendado por consistencia con el resto del monorepo: Next.js + TypeScript + TanStack Query, consumiendo el mismo GraphQL del backend, reutilizando componentes base de `web` donde tenga sentido (ej. sistema de diseño, aunque el admin normalmente usa una librería de componentes de admin, ej. shadcn/ui, en vez del diseño público del sitio).
6. **Previsualización de contenido**: ¿el CMS necesita "preview" en vivo de cómo se ve el contenido en `web` antes de publicar?

## Pasos detallados

1. Presentar las opciones anteriores al usuario con recomendación (Opción A o C, dado que ya existe un backend propio con GraphQL — adoptar un CMS externo como Opción B añade una fuente de verdad de datos paralela que complica la arquitectura, salvo que haya una razón fuerte).
2. Registrar la decisión final en este documento (actualizar esta sección con la resolución).
3. Si se elige construir custom: definir stack exacto, estructura de carpetas, y patrón de autenticación — análogo a como se documentó `web` y `backend`.
4. Producir un mini "documento de arquitectura del cms-admin" (`docs/architecture/cms-admin.md`) con la decisión final, antes de pasar a la Fase 4 (scaffold).

## Entregables

- Decisión de arquitectura documentada y confirmada por el usuario.
- `docs/architecture/cms-admin.md` con: stack elegido, alcance de entidades, modelo de auth/roles, estrategia de medios.

## Criterios de aceptación (DoD)

- [ ] Usuario confirmó explícitamente la opción de arquitectura elegida.
- [ ] Lista de entidades a administrar está completa y acordada.
- [ ] Estrategia de medios (almacenamiento de imágenes) está definida.
- [ ] `docs/architecture/cms-admin.md` existe y refleja lo acordado.

## Riesgos / notas

- Esta fase es intencionalmente de decisión, no de código — no avanzar a la Fase 4 sin confirmación explícita del usuario, ya que define el resto del trabajo de este paquete.
