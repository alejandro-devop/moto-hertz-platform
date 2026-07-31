# PATRON.md — cómo se construye una sección del CMS

Receta para agregar un dominio administrable a `moto-hertz-platform`, en las
tres capas. El ejemplo vivo es **`motorcycle` / `motos`**: todo lo que aquí se
describe está funcionando ahí, y los enlaces apuntan a los archivos reales.

Se escribió en la **Fase 0** del [plan CMS](PLAN.md), después de extraer de
`motos` las piezas que se repiten. Si al construir una sección algo de esta
receta no encaja, la receta está mal — corrígela aquí antes de improvisar.

---

## 0. Antes de empezar

Una sección se construye **de abajo hacia arriba y de una sola pasada**:
backend → cms-admin → web. No tiene sentido dibujar la ficha de un dominio que
el backend todavía no sabe guardar, ni dejar el sitio público leyendo un mock
cuando el panel ya edita datos reales.

Levanta el entorno completo:

```bash
cd backend && npm run docker:up     # backend + postgres + redis en :8080
pnpm dev                            # web :3000 · cms-admin :3001
```

Credenciales de desarrollo del panel: `admin@yamahaoriente.com` / `admin123`
(ver `backend/.env`).

---

## 1. Capa `backend`

Referencia completa: el dominio `motorcycle`.

| Paso | Archivo | Qué va ahí |
| --- | --- | --- |
| 1 | [`src/shared/database/schema.ts`](../../backend/src/shared/database/schema.ts) | La tabla en Drizzle. Las tres tablas pendientes (`service_points`, `services`, `news`) **ya existen**; solo hay que agregar columnas si faltan. |
| 2 | `migrations/00N_*.sql` | Una migración por cambio, numerada. Se aplica con `npm run migrate`. Nunca se edita una migración ya aplicada: se agrega otra. |
| 3 | [`src/types/services/<dominio>.types.ts`](../../backend/src/types/services/motorcycle.types.ts) | Los tipos del dominio: la entidad, `Create…Input`, `Update…Input`, `…Collection`. |
| 4 | [`src/services/<dominio>.service.ts`](../../backend/src/services/motorcycle.service.ts) | El acceso a datos. Funciones sueltas (`list…`, `get…BySlug`, `get…ById`, `create…`, `update…`, `delete…`) y un objeto `…Service` al final que las agrupa. Aquí no entra nada de GraphQL. |
| 5 | [`src/validators/schemas/<dominio>.schemas.ts`](../../backend/src/validators/schemas/motorcycle.schemas.ts) | Zod para **todo** lo que llega de afuera: args de query, input de alta, input de edición. El de edición es el de alta en `.partial()` más el `id`. |
| 6 | [`src/graphql/modules/<dominio>/<dominio>.schema.ts`](../../backend/src/graphql/modules/motorcycle/motorcycle.schema.ts) | SDL del dominio: tipos, `extend type Query`, `extend type Mutation`, inputs. |
| 7 | [`src/graphql/modules/<dominio>/<dominio>.resolvers.ts`](../../backend/src/graphql/modules/motorcycle/motorcycle.resolvers.ts) | Resolvers finos: validan con Zod y llaman al service. **Toda mutación empieza con `requireAuth(context, '<nombre>')`**; las queries de lectura son públicas porque el sitio las consume sin sesión. |
| 8 | [`src/graphql/schema.ts`](../../backend/src/graphql/schema.ts) y [`resolvers.ts`](../../backend/src/graphql/resolvers.ts) | Registrar el módulo en los dos arreglos. Si falta uno, el tipo existe pero no resuelve. |
| 9 | [`tests/unit/services/<dominio>.service.test.ts`](../../backend/tests/unit/services/motorcycle.service.test.ts) | Tests del service con la base mockeada (`tests/helpers/mocks.ts`). |

Nombres de las operaciones, tal como los espera el panel:
`<dominio>s(page, limit, …)`, `<dominio>(slug)`, `<dominio>Add`, `<dominio>Edit`,
`<dominio>Remove`, `<dominio>Restore`, `<dominio>Purge`.

### 1.1 Soft delete — obligatorio en todo dominio

> Escrito en la **Fase 1**, que puso `deleted_at` en `media` y en las cuatro
> tablas de contenido. Las columnas **ya existen**: no hay que migrarlas otra
> vez, hay que *usarlas*. La referencia viva es `motorcycle.service.ts`.

Eliminar desde el panel **nunca borra**: manda a la papelera. Un dominio nuevo
nace con esto o nace mal.

| Dónde | Qué hace |
| --- | --- |
| `schema.ts` | La tabla ya trae `deletedAt: timestamp('deleted_at')`. |
| `service.ts` · listar | El filtro `options.trashed ? isNotNull(x.deletedAt) : isNull(x.deletedAt)` es la **primera** condición de `buildFilters`, siempre. |
| `service.ts` · por slug | `and(eq(x.slug, slug), isNull(x.deletedAt))`. Lo borrado no existe para el sitio público. |
| `service.ts` · por id | **Sin filtro**: restaurar y purgar trabajan justamente sobre lo borrado. |
| `service.ts` · `trash…` | `set({ deletedAt: new Date() })`. Idempotente: si ya está en la papelera, no hace nada. |
| `service.ts` · `restore…` | `set({ deletedAt: null })`, devuelve el registro. |
| `service.ts` · `purge…` | `BadRequestError` si no está en la papelera; si está, `delete` de verdad. |
| SDL | `deletedAt: DateTime` en el tipo, `trashed: Boolean` en la query de lista, y las mutaciones `…Restore` / `…Purge`. |
| Resolvers | Las tres mutaciones con `requireAuth`. `…Remove` sigue llamándose igual (el panel ya lo usa), pero ahora manda a la papelera. |

En `cms-admin`:

- La papelera **no es una pantalla aparte**: es un valor más del filtro `estado`
  («En papelera»), que dispara **otra consulta** (`trashed: true`) con su propia
  entrada de caché. Ver `motos/filters.ts` y `use-motorcycles.ts`.
- Cuando el filtro está en papelera, la fila muestra una píldora «En papelera» en
  vez del estado de publicación, y `<x>-actions.tsx` devuelve **otra lista de
  acciones**: restaurar y eliminar definitivamente, nada más.
- Los dos borrados se confirman, y cada diálogo dice exactamente qué pasa: el
  primero que se puede recuperar, el segundo que no y que las fotos quedan en
  la biblioteca.

Lo que **no** hace el soft delete: tocar archivos. Eliminar un registro no borra
sus imágenes — se borran desde `/medios`, y solo desde ahí.

Comprobación de la capa, sin tocar el navegador:

```bash
curl -s localhost:8080/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ motorcycles(page:1,limit:3){ total motorcycles{ id name } } }"}'
```

---

## 2. Capa `cms-admin`

### 2.1 Los archivos del módulo

```
lib/graphql/<dominio>.ts                  ← documentos GraphQL + tipos TS del dominio
app/(admin)/<ruta>/page.tsx               ← lista + orquestación de la ficha
app/(admin)/<ruta>/filters.ts             ← filtros del dominio (tipos, etiquetas, aplicar)
app/(admin)/<ruta>/use-<dominio>.ts       ← query y mutaciones (TanStack Query)
app/(admin)/<ruta>/<x>-row.tsx            ← fila de tabla + tarjeta de móvil
app/(admin)/<ruta>/<x>-actions.tsx        ← qué acciones hay y sus diálogos
app/(admin)/<ruta>/<x>-filters.tsx        ← los desplegables y chips concretos
app/(admin)/<ruta>/form-sections.ts       ← en qué secciones se parte la ficha
app/(admin)/<ruta>/<x>-form-sheet.tsx     ← el contenido de cada sección
app/(admin)/<ruta>/<x>-form-state.ts      ← estado plano, mapeo y validación Zod
```

Y una línea en [`app/(admin)/nav-links.ts`](<../../cms-admin/app/(admin)/nav-links.ts>).
Los cinco primeros destinos salen en la barra inferior del móvil, así que el
orden de ese arreglo es una decisión de producto, no de código.

### 2.2 Las piezas compartidas (no las reescribas)

**Listas** — `lib/list-params.ts`, `lib/use-url-filters.ts`, `components/admin/`:

| Pieza | Archivo | Para qué |
| --- | --- | --- |
| `leerTexto` · `leerOpcion` · `leerClave` · `leerPagina` | [`lib/list-params.ts`](../../cms-admin/lib/list-params.ts) | Leer un filtro de la URL con su valor por defecto. |
| `escribirParams(filtros, porDefecto)` | ídem | Serializa **solo lo que se desvía del valor por defecto**: la URL queda corta y compartible. |
| `contarFiltrosActivos` | ídem | Cuántos filtros hay puestos (sin contar `q`, `orden` ni `pagina`). |
| `paginar(items, pagina)` · `Pagina<T>` | ídem | Corta la lista de a 25 y devuelve `desde`/`hasta`/`total`. Si la página ya no existe, cae en la última. |
| `compararNulosAlFinal` · `compararTexto` | ídem | Orden con los registros sin dato al final y alfabético en español. |
| `useFiltrosUrl({ ruta, leer, escribir })` | [`lib/use-url-filters.ts`](../../cms-admin/lib/use-url-filters.ts) | `{ filtros, actualizar, limpiarTodo }`. **`actualizar` vuelve a la página 1** salvo que el parche traiga página. |
| `ListaResponsive` | [`components/admin/responsive-list.tsx`](../../cms-admin/components/admin/responsive-list.tsx) | Tabla en escritorio, tarjetas en móvil, paginación en las dos. |
| `Paginacion` | [`components/admin/pagination.tsx`](../../cms-admin/components/admin/pagination.tsx) | Primera, última y las vecinas de la actual. |
| `BarraFiltros` · `SelectFiltro` · `FilterChip` · `opcionesDe` | [`components/admin/filter-bar.tsx`](../../cms-admin/components/admin/filter-bar.tsx) | Fila de filtros en escritorio, hoja inferior en móvil. |
| `RowActions` · `AccionFila` | [`components/admin/row-actions.tsx`](../../cms-admin/components/admin/row-actions.tsx) | Menú de fila en escritorio y hoja inferior en móvil, con la misma lista de acciones. |

**Fichas** — `lib/form-sections.ts`, `lib/form-state.ts`, `components/admin/`:

| Pieza | Archivo | Para qué |
| --- | --- | --- |
| `FormSheet` | [`components/admin/form-sheet.tsx`](../../cms-admin/components/admin/form-sheet.tsx) | Hoja lateral, pestañas por sección con contador de errores, barra de guardado fija y el aviso de «¿Descartar los cambios?». |
| `Field` · `ToggleRow` · `Grid` · `ALTO_CAMPO` | [`components/admin/form-fields.tsx`](../../cms-admin/components/admin/form-fields.tsx) | Los controles de la ficha. `ALTO_CAMPO` es `h-11 md:h-9`. |
| `ImagePicker` · `GaleriaImagenes` | [`components/admin/image-picker.tsx`](../../cms-admin/components/admin/image-picker.tsx) | **Todo campo de imagen usa uno de los dos.** Nunca un `<Input>` de URL a pelo. |
| `SeccionFicha` · `seccionDeCampo` · `erroresPorSeccion` | [`lib/form-sections.ts`](../../cms-admin/lib/form-sections.ts) | La forma de una sección y cómo se ubica un error en ella. |
| `erroresDeZod` · `listaDesdeTexto` · `textoDesdeLista` · `textoOpcional` | [`lib/form-state.ts`](../../cms-admin/lib/form-state.ts) | Un error por campo; texto separado por comas ⇄ arreglo; `""` → `undefined`. |

**Ya existían y se siguen usando**: `page-header.tsx`, `states.tsx` (vacío,
error, esqueletos), `status-pill.tsx`, `thumb.tsx`, `lib/errors.ts`,
`lib/format.ts` (`formatCop`, `formatDate`, `daysUntil`, `slugify`,
`textoBuscable`…).

### 2.3 El orden en que se escribe un módulo

1. **`lib/graphql/<dominio>.ts`** — copia la forma de
   [`motorcycles.ts`](../../cms-admin/lib/graphql/motorcycles.ts): tipos TS que
   reflejan el SDL, un fragmento con los campos, y las cuatro operaciones
   (`…QUERY`, `…_ADD_MUTATION`, `…_EDIT_MUTATION`, `…_REMOVE_MUTATION`).

2. **`use-<dominio>.ts`** — un `useQuery` con la clave del dominio y un
   `use…Mutations()` que devuelve `{ add, edit, patch, remove }`. Cada mutación
   invalida la query y saca un `toast`; el error se registra con
   `registrarError` y se muestra con `mensajeDeError`.
   Ver [`use-motorcycles.ts`](<../../cms-admin/app/(admin)/motos/use-motorcycles.ts>).
   > Los datos van al navegador por `/api/graphql`, que adjunta el JWT desde la
   > cookie httpOnly. En el componente no hay que hacer nada para autenticarse.

3. **`filters.ts`** — el tipo `Filtros` (siempre con `q`, `orden` y `pagina`),
   `FILTROS_POR_DEFECTO`, los `ETIQUETAS_*`, `leerFiltros`, `escribirFiltros`,
   `contarFiltrosActivos` y `aplicarFiltros`. Las tres primeras funciones son
   tres líneas cada una apoyándose en `lib/list-params.ts`; lo demás es dominio.
   Ver [`filters.ts`](<../../cms-admin/app/(admin)/motos/filters.ts>).

4. **`page.tsx`** — `useFiltrosUrl` + la query + `aplicarFiltros` + `paginar` +
   `ListaResponsive`, con los tres estados obligatorios: error (`ErrorState` con
   reintento), cargando (`TableSkeleton`), y **dos** vacíos distintos — «no hay
   nada todavía» (invita a crear) y «nada coincide» (invita a quitar filtros).
   Ver [`page.tsx`](<../../cms-admin/app/(admin)/motos/page.tsx>).

5. **`<x>-row.tsx`** — la fila y la tarjeta. Es lo más específico de cada
   dominio y **a propósito no está abstraído**: la fila decide qué se ve sin
   abrir la ficha, y eso cambia por completo entre motos, sedes y noticias.
   Regla: la tarjeta de móvil no puede mostrar menos que la fila, solo
   distribuido de otra forma.

6. **`<x>-actions.tsx`** — arma un `AccionFila[]` y se lo pasa a `RowActions`.
   El orden importa: primero lo que de verdad se hace todos los días, después
   editar y ver en el sitio, y **eliminar de última, separada y en rojo**.
   Cuando exista una alternativa no destructiva (apagar `available`), esa va
   arriba y eliminar advierte que la otra existe.

7. **`form-sections.ts`** — los campos agrupados como los piensa quien los
   llena, no como están en la tabla. Cada sección lista sus `campos` para que
   la ficha sepa en qué pestaña poner el contador de errores.

8. **`<x>-form-state.ts`** — un `FormState` **plano** aunque el tipo del backend
   sea anidado (así el «sin guardar» se calcula con una comparación y cada campo
   tiene una sola fuente de verdad), más `…ToForm`, `formToInput` y `validar`.

9. **`<x>-form-sheet.tsx`** — el estado de la ficha y un `<TabsContent>` por
   sección dentro de `FormSheet`. El esqueleto que se repite es este:

   ```tsx
   const [form, setForm] = useState<FormState>(EMPTY_FORM);
   const [seccion, setSeccion] = useState<SeccionId>('identidad');
   const [errores, setErrores] = useState<Record<string, string>>({});
   const inicial = useRef<FormState>(EMPTY_FORM);

   useEffect(() => {
     if (!open) return;
     const base = registro ? registroToForm(registro) : EMPTY_FORM;
     setForm(base);
     inicial.current = base;      // la referencia contra la que se mide «sucio»
     setErrores({});
     setSeccion(seccionInicial ?? 'identidad');
   }, [open, registro, seccionInicial]);

   const sucio = JSON.stringify(form) !== JSON.stringify(inicial.current);
   ```

   Está **duplicado a propósito** (ver «Lo que no se abstrajo»).

### 2.4 Campos de imagen

Desde la **Fase 1** no se escribe una URL de imagen a mano en ninguna ficha.
Hay dos componentes y se elige por cardinalidad:

```tsx
/* Una sola imagen (portada de una noticia, foto de una sede, banner). */
<Field label="Imagen">
  <ImagePicker value={form.image} onChange={(url) => set('image', url)} />
</Field>

/* Varias, con portada y orden (fotos de una moto). */
<GaleriaImagenes
  fotos={fotos}
  error={errores.imagesMain}
  onChange={(next) => setForm((p) => ({ ...p, imagesMain: next[0] ?? '', imagesGallery: next.slice(1) }))}
/>
```

Lo que traen de fábrica y no hay que reimplementar: arrastrar y soltar, subida
de a una con barra de progreso, `accept="image/*"` (en el teléfono ofrece
cámara), el campo de **pegar URLs externas** —el catálogo legacy vive fuera y no
se puede romper— y, en la galería, portada y reordenamiento.

En el estado plano de la ficha, una imagen es **un `string` con la URL**. Lo que
guarda el backend es la URL, no el id del archivo: así una URL externa y una
subida son el mismo campo.

La subida no pasa por `/api/graphql` (tiene su propio límite de body): va por
`/api/media/upload`, que adjunta el JWT server-side igual que el proxy de
GraphQL.

### 2.5 Reglas que no se negocian

- **Paridad escritorio/móvil.** Toda acción alcanzable en las dos pantallas. Se
  comprueba a 390 px de ancho, no imaginando.
- **Objetivos de 44 px en móvil** (`ALTO_CAMPO` = `h-11 md:h-9`), foco visible
  en todo control, cifras con `tabular-nums`.
- **Los filtros viven en la URL.** Nada de estado local que se pierda al
  recargar o al volver atrás.
- **Cambiar un filtro vuelve a la página 1.** Lo hace `useFiltrosUrl`.
- **Cerrar una ficha con cambios sin guardar siempre pregunta.** Lo hace
  `FormSheet`.
- **Tema claro y oscuro.** Ningún color escrito a mano: solo variables del tema
  (`text-muted-foreground`, `bg-card`, `border-border`, `text-warning`…).
- El resto del sistema de diseño está en
  [`cms-admin/CLAUDE.md`](../../cms-admin/CLAUDE.md).

---

## 3. Capa `web`

El sitio público lee del mismo backend, sin sesión.

1. **`web/src/types/<dominio>.ts`** — los tipos del dominio, espejo del SDL.
2. **`web/src/services/<dominio>.ts`** — el cliente GraphQL, copiando
   [`motorcycles.ts`](../../web/src/services/motorcycles.ts): un fragmento con
   los campos y una función por consulta (lista y detalle por slug).
3. **Reemplazar el import del mock** en la página que lo consume, y ajustar la
   revalidación (`export const revalidate = …`) si la página es estática.
4. **Borrar el JSON de [`web/src/data/`](../../web/src/data)** y todo lo que
   quede apuntándole. Un mock que sobrevive es un mock que alguien va a volver
   a usar sin darse cuenta.
5. Comprobar la página en el navegador con el backend arriba **y** con el
   backend caído: el sitio no puede quedar en blanco por una sección.

Pendientes en `web` al cerrar la Fase 0: `service-points-mock.json`,
`services-mock.json`, `news-mock.json` y `home-mock.json` (este último vía
`web/src/services/contentful.ts`).

---

## 4. Lo que **no** se abstrajo, y por qué

La Fase 0 extrajo lo que ya se repetía. Esto se dejó duplicado a conciencia,
porque abstraerlo mal cuesta más que escribirlo dos veces:

- **La fila y la tarjeta (`<x>-row.tsx`).** Era el candidato más dudoso del
  plan. Qué columnas hay, qué se destaca y qué se resume es la decisión de
  diseño más propia de cada dominio; un `<FilaGenerica columnas={…}/>` habría
  terminado con un `render` por celda, que es la misma fila con más ceremonia.
  Lo que sí se comparte es el **contenedor** (`ListaResponsive`), que es donde
  vive la regla de paridad escritorio/móvil.
- **El estado de la ficha** (el `useState` + `useRef` + `useEffect` de arriba).
  Son 15 líneas, pero un `useFichaState` genérico tendría que aceptar el mapeo,
  la validación y las derivaciones propias del dominio (en motos, el slug que se
  sigue del nombre hasta que alguien lo escribe). Cuando dos secciones más lo
  hayan escrito igual, se extrae con evidencia.
- ~~**`GalleryEditor`**~~ — **resuelto en la Fase 1**: se reescribió como
  `components/admin/image-picker.tsx` (`GaleriaImagenes` e `ImagePicker`), con
  subida real. Ya no vive en `motos/`.
- **El diálogo de precio rápido** (`PrecioDialog`) es de motos. Cuando otra
  sección necesite un «editar un solo campo desde la lista», ahí se verá si vale
  un `CampoRapidoDialog`.
- **`lib/motorcycle-status.ts`** (publicación derivada y alertas de papeles) es
  dominio puro: no se toca.

---

## 5. Lista de comprobación antes de cerrar una sección

- [ ] `cd backend && npm test` pasa.
- [ ] `pnpm --filter yamaha-oriente-cms-admin build` compila.
- [ ] `npx tsc --noEmit` limpio en `cms-admin`.
- [ ] El dominio tiene papelera completa (§1.1) y la lista la deja alcanzar.
- [ ] Ningún campo de imagen es un `<Input>` de texto: todos usan `ImagePicker`
      o `GaleriaImagenes` (§2.4).
- [ ] La lista carga, busca, filtra, ordena y pagina; los filtros sobreviven a
      un `F5` y al botón de atrás.
- [ ] La ficha guarda, valida, avisa antes de descartar y salta a la pestaña del
      primer error.
- [ ] Todo funciona a 390 px de ancho y en tema oscuro.
- [ ] La página pública correspondiente ya no lee un mock y el JSON está
      borrado.
- [ ] `cms-admin/CLAUDE.md` menciona las decisiones nuevas del módulo.
