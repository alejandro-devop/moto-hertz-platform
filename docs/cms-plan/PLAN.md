# Plan CMS — administración del resto del sitio

Plan de construcción, fase por fase, de la administración de las secciones que
todavía **no** se pueden editar desde `cms-admin`. Es la continuación natural de
`docs/PLAN.md` (el plan del monorepo), que dejó `motos` funcionando de punta a
punta y los demás dominios como placeholders.

Se ejecuta con la skill **`cms-fase`** (`.claude/skills/cms-fase/SKILL.md`), que
delega el trabajo en el subagente **`cms-seccion`**. El estado vive en
`.claude/state/cms-phase-state.json` y persiste entre sesiones.

## Punto de partida

| Sección del sitio | Backend | cms-admin | web |
|---|---|---|---|
| Motos | ✅ completo | ✅ completo | ✅ consume el backend |
| Puntos de atención | ⏳ solo tabla y migración | ⏳ placeholder | ❌ `service-points-mock.json` |
| Servicios | ⏳ solo tabla y migración | ⏳ placeholder | ❌ `services-mock.json` |
| Noticias | ⏳ solo tabla y migración | ⏳ placeholder | ❌ `news-mock.json` |
| Home / banners | ❌ no existe tabla | ❌ no existe | ❌ `home-mock.json` vía `contentful.ts` |
| Configuración del sitio | ❌ no existe tabla | ❌ no existe | ❌ valores en el código |
| Subida de imágenes | ✅ driver + endpoint | ✅ biblioteca y papelera | — |

Cada sección necesita la misma rebanada vertical: **backend** (service, tipos,
validadores Zod, módulo GraphQL) → **cms-admin** (módulo de administración) →
**web** (reemplazar el mock por datos reales). `motorcycle` es la referencia de
patrón en las tres capas.

## Fases

| # | Fase | Documento | Estado |
|---|------|-----------|--------|
| 0 | Cimientos del patrón | [00-cimientos-patron.md](phases/00-cimientos-patron.md) | completed |
| 1 | Medios: subida de imágenes | [01-medios.md](phases/01-medios.md) | completed |
| 2 | Puntos de atención | [02-puntos-de-atencion.md](phases/02-puntos-de-atencion.md) | pending |
| 3 | Servicios | [03-servicios.md](phases/03-servicios.md) | pending |
| 4 | Noticias | [04-noticias.md](phases/04-noticias.md) | pending |
| 5 | Home y banners | [05-home-y-banners.md](phases/05-home-y-banners.md) | pending |
| 6 | Configuración del sitio | [06-configuracion-sitio.md](phases/06-configuracion-sitio.md) | pending |
| 7 | QA y cierre del CMS | [07-qa-y-cierre.md](phases/07-qa-y-cierre.md) | pending |

## Por qué este orden

**Los cimientos van primero (Fase 0)** porque el módulo `motos` del admin ya
resolvió lista responsive, filtros en la URL, ficha por secciones, acciones y
estados — pero ese código todavía es específico de motos. Extraer lo que se
repite antes de escribir la segunda sección evita reescribirlo cuatro veces.

**Los medios van segundos (Fase 1)**, antes que cualquier sección de contenido,
aunque no sea una "sección" del sitio. Hoy las imágenes son URLs de texto libre;
si se construyen puntos de atención, servicios, noticias y banners con campos de
URL y después se agrega la subida real, hay que volver sobre los cinco módulos.
Es la fase que se puede saltar (`/cms-fase goto 2`) si prefieres seguir con URLs
por ahora y asumir ese retrabajo.

**Después, una sección por fase**, de la más simple a la más compleja: puntos de
atención (formulario plano) → servicios (listas anidadas) → noticias (contenido
largo y fechas de publicación) → home y banners (tabla nueva, orden) →
configuración del sitio (registro único, no lista).

## Cómo se ejecuta

```
/cms-fase            → ejecuta la fase actual (delega en el subagente cms-seccion)
/cms-fase status     → muestra en qué fase vamos y cuál sigue, sin ejecutar
/cms-fase goto <N>   → salta a la fase N (pide confirmación)
/cms-fase reset      → reinicia el progreso (pide confirmación)
```

Al cerrar cada fase, la skill entrega **los pasos de prueba manual** para que
verifiques el trabajo con tus propios ojos antes de darla por buena. Ninguna
fase se marca como `completed` sin que confirmes esas pruebas.

## Relación con `docs/PLAN.md`

El plan del monorepo sigue su curso aparte (va en la Fase 7, despliegue). Este
plan no lo reemplaza ni depende de que aquel termine: son dos ejes de trabajo
distintos sobre el mismo repositorio.
