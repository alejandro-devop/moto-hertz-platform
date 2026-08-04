# CLAUDE.md — cms-admin (yamaha-oriente-cms-admin)

> Scaffold inicial en Fase 4 del plan monorepo. Ver `../docs/phases/04-scaffold-cms.md` y la decisión de arquitectura en `../docs/architecture/cms-admin.md`.

## Qué es este proyecto

Panel de administración custom que edita el contenido servido por `../backend` (motos, puntos de atención, servicios, noticias, banners, configuración del sitio). Sin CMS externo — habla directamente con el GraphQL propio.

## Stack

Next.js 15 (App Router) · TypeScript · React 19 · Tailwind v4 · shadcn/ui estilo `base-nova` sobre `@base-ui/react` · TanStack Query · graphql-request · next-themes

## Sistema de diseño

> Rediseño con prioridad UX y paridad escritorio/móvil. Toda acción del panel es alcanzable en las dos pantallas.

**Tipografía.** `IBM Plex Sans` para la interfaz y `IBM Plex Mono` para datos (precios, fechas, slugs, kilometraje). Son la misma superfamilia a propósito: el texto y las cifras de las columnas comparten proporciones y tono. Se cargan con `next/font/google` en `app/layout.tsx` y se exponen como `--font-plex-sans` / `--font-plex-mono`.

> **Dos reglas que hay que respetar o el panel vuelve a verse en Times New Roman.** Las clases de `next/font` van en **`<html>`, no en `<body>`**: `globals.css` consume las variables desde `:root`, y si vivieran en `<body>` no existirían al resolverse ahí, la declaración quedaría inválida y `font-family` caería al serif por defecto. Y en `@theme inline` la pila va **completa** (`--font-sans: var(--font-plex-sans), ui-sans-serif, …`), nunca `--font-sans: var(--font-sans)`, que se autorreferencia. El scaffold original fallaba por ambas cosas, así que Geist nunca llegó a cargarse.
>
> Para comprobarlo no basta con mirar: en la consola del navegador, `getComputedStyle(document.documentElement).fontFamily` tiene que empezar por `"IBM Plex Sans"`, y `[...document.fonts].filter(f => f.status === 'loaded')` tiene que listarla.

**Color.** «Amarillo de placa sobre asfalto». El acento (`--primary`, `#F2C230`) es el único color saturado: acción principal, destino activo y foco. Los estados (`--success` / `--warning` / `--destructive`) son semánticos y viven aparte del acento. La barra de navegación (`--rail-*`) se queda en asfalto en los dos temas: es la constante del producto. Tema claro y oscuro con `next-themes`, selector en la barra superior (escritorio) y en la hoja «Más» (móvil).

**Reglas.** Objetivos de 44 px en móvil (`h-11 md:h-9`), foco visible en todo control, cifras con `tabular-nums`. La utilidad `scroll-x` es para tiras horizontales: `overflow-x: auto` a secas convierte el eje vertical en `auto` y saca una barra sobrante.

> **Una trampa de especificidad que ya mordió una vez y puede volver a morder.** `components/ui/select.tsx` fijaba la altura por defecto de `SelectTrigger` con `data-[size=default]:h-8` — una clase con variante de atributo, que en CSS tiene **más especificidad** que una clase plana como el `h-11` que le pasa un consumidor por `className`. El resultado, arrastrado sin detectarse desde la Fase 0 hasta la Fase 7: **todos** los `<Select>` del panel (los filtros de las seis listas y los desplegables de las tres fichas que tenían uno) medían 32 px sin importar qué altura pidiera quien lo usaba — ni los 44 px de móvil de `SelectFiltro` apilado, ni los 36/44 de `ALTO_CAMPO`. Se arregló pasando esas alturas por defecto a clases planas (`h-8`/`h-7`, sin el prefijo `data-[size=…]:`) para que `cn()` (que usa `tailwind-merge`) las trate como el mismo grupo que el `h-11`/`h-9` que llega por `className` y se quede con el que corresponde. **La lección**: cualquier componente base que use un selector de variante (`data-[…]:`, `[&:…]`, `has-[…]:`…) para su tamaño por defecto puede ganarle a un `className` plano sin que se note en el código — solo se ve midiendo en el navegador. Verificarlo con `getComputedStyle(el).height`, no con una lectura del JSX.

## Estructura del panel

`app/(admin)/layout.tsx` es `force-dynamic` (toda ruta exige cookie de sesión, y así `useSearchParams` funciona en los filtros) y solo monta `components/admin/admin-shell.tsx`:

| Componente | Escritorio | Móvil |
| --- | --- | --- |
| `admin-rail.tsx` | barra lateral colapsable (persiste en `localStorage`) | oculta |
| `admin-tabbar.tsx` | oculta | barra inferior de 5 destinos + hoja «Más» |
| `admin-topbar.tsx` | tema + sitio público | marca, sección y sitio público |

**No hay buscador en la barra superior.** Se probó un buscador global ahí (escribía en `?q=` de la sección donde uno estuviera, con `⌘K` para enfocarlo desde cualquier pantalla) y se sacó: cambiaba de sección según dónde estuviera parado quien administra, y eso se leyó como un buscador global en vez del buscador de la lista que se estaba mirando. Cada lista tiene el suyo, a la vista, en su propia fila de filtros — ver `BuscadorLista` más abajo.

Piezas compartidas de presentación: `page-header`, `states` (vacío, error, esqueletos), `status-pill`, `thumb`, `proximamente`.

Piezas compartidas de módulo, extraídas de `motos` en la Fase 0 del plan CMS (receta completa en `../docs/cms-plan/PATRON.md`):

| Pieza | Archivo | Qué resuelve |
| --- | --- | --- |
| `ListaResponsive` | `components/admin/responsive-list.tsx` | Tabla en escritorio, tarjetas en móvil, paginación en las dos. La fila y la tarjeta las pone cada módulo. |
| `Paginacion` | `components/admin/pagination.tsx` | Primera, última y las vecinas de la actual. |
| `BarraFiltros`, `SelectFiltro`, `FilterChip`, `opcionesDe` | `components/admin/filter-bar.tsx` | Fila de filtros en escritorio y hoja inferior en móvil, con el contador de filtros puestos. `BarraFiltros` acepta un prop `busqueda` que renderiza `BuscadorLista` (mismo archivo): el campo de texto de la lista, siempre a la vista arriba de los demás filtros. El placeholder de cada módulo sale de `lib/list-search.ts` (`BUSCADORES`). |
| `RowActions`, `AccionFila` | `components/admin/row-actions.tsx` | La misma lista de acciones como menú de fila (escritorio) y como hoja inferior (móvil). |
| `FormSheet` | `components/admin/form-sheet.tsx` | Armazón de la ficha: pestañas por sección con contador de errores, barra de guardado fija y aviso antes de descartar. |
| `ListaEditable` | `components/admin/list-editor.tsx` | Una lista de renglones **con orden**: agregar, quitar, subir y bajar. Extraída en la Fase 3 (`features`/`benefits`). Tiene un prop `genero?: 'f' \| 'm'` (por defecto `'f'`) para el aviso de lista vacía («ningún color», no «ninguna color») — pásalo en `'m'` cuando `etiquetaItem` sea masculino. |
| `useFichaState` | `lib/use-ficha-state.ts` | Todo el estado de una ficha: formulario plano, sección abierta, errores, «sucio» y el guardado que valida y salta al primer error. Extraído en la Fase 3. |
| `Field`, `ToggleRow`, `Grid`, `ALTO_CAMPO` | `components/admin/form-fields.tsx` | Los controles de la ficha. `ALTO_CAMPO` = `h-11 md:h-9`. |
| `leerOpcion`, `escribirParams`, `paginar`, comparadores | `lib/list-params.ts` | Filtros en la URL (solo se serializa lo que se desvía del valor por defecto), orden y paginación. |
| `useFiltrosUrl` | `lib/use-url-filters.ts` | `{ filtros, actualizar, limpiarTodo }`; **`actualizar` vuelve a la página 1**. |
| `SeccionFicha`, `seccionDeCampo`, `erroresPorSeccion` | `lib/form-sections.ts` | La forma de una sección de ficha y dónde cae cada error. |
| `erroresDeZod`, `listaDesdeTexto`, `textoDesdeLista`, `textoOpcional` | `lib/form-state.ts` | Plomería del estado de la ficha. |
| `RichTextEditor` | `components/admin/rich-text-editor.tsx` | Editor de contenido enriquecido (Tiptap): negrita, cursiva, encabezados, listas, cita y enlace, con barra de 44 px en móvil. Guarda HTML. Extraído en la Fase 4 para `news.content`; la próxima sección con contenido largo lo reusa tal cual. |

**Lo que quedó sin abstraer a propósito**: la fila/tarjeta de cada dominio (`<x>-row.tsx`) y el diálogo de precio rápido. Lo de la fila **se revisó en la Fase 3 con tres copias sobre la mesa y se confirmó**: solo comparten el botón que abre la ficha. El `GalleryEditor` de fotos sí se extrajo (Fase 1, `components/admin/image-picker.tsx`), y **el estado de la ficha también, en la Fase 3** (`lib/use-ficha-state.ts`): las tres copias eran idénticas salvo los nombres de las variables. El razonamiento está en `../docs/cms-plan/PATRON.md`, sección «Lo que no se abstrajo, y por qué».

## Autenticación

Un solo admin (sin roles), credenciales por variable de entorno del backend (`ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`). Flujo:

1. `app/login/page.tsx` hace `POST /api/auth/login` con email/password.
2. `app/api/auth/login/route.ts` llama a la mutation `login` del backend y, si es válida, guarda el JWT en una cookie **httpOnly** (`lib/session.ts`).
3. `middleware.ts` exige la cookie en toda ruta salvo `/login` y `/api/auth/*`.
4. Las queries/mutations del navegador van a `/api/graphql` (`app/api/graphql/route.ts`), que lee la cookie server-side y reenvía al backend con `Authorization: Bearer <token>` — el JWT nunca es accesible desde JS del cliente.

## Patrón de módulo CRUD (referencia: `motos`)

> La receta paso a paso, en las tres capas del monorepo, está en **`../docs/cms-plan/PATRON.md`**. Aquí solo el resumen de esta capa.

Cada dominio administrado sigue esta estructura, replicando `app/(admin)/motos/`:

```
lib/graphql/<dominio>.ts        ← documentos GraphQL + tipos TS
app/(admin)/<dominio>/page.tsx           ← lista + orquestación de diálogos
app/(admin)/<dominio>/filters.ts         ← tipos y funciones puras de filtro/orden/página
app/(admin)/<dominio>/use-<dominio>.ts   ← query y mutaciones (TanStack Query)
app/(admin)/<dominio>/<x>-row.tsx        ← fila de tabla + tarjeta de móvil
app/(admin)/<dominio>/<x>-actions.tsx    ← qué acciones hay + sus confirmaciones
app/(admin)/<dominio>/<x>-filters.tsx    ← los desplegables y chips concretos
app/(admin)/<dominio>/form-sections.ts   ← en qué secciones se parte la ficha
app/(admin)/<dominio>/<x>-form-sheet.tsx ← contenido de cada sección de la ficha
app/(admin)/<dominio>/<x>-form-state.ts  ← estado plano, mapeo y validación Zod
```

Las mutaciones de escritura requieren sesión (`requireAuth` en el backend); el proxy `/api/graphql` ya adjunta el token en cada request, no hay que hacer nada adicional en el componente.

### Decisiones del módulo `motos`

**Filtros en la URL.** `q`, `estado`, `condicion`, `marca`, `sede`, `papeles`, `orden` y `pagina` viven en `searchParams` (solo se serializa lo que se desvía del valor por defecto). Se pueden compartir y el botón de atrás funciona.

**Filtrado en el cliente.** La query `motorcycles` del backend no busca ni ordena, y buscar es lo que más se hace aquí. `use-motorcycles.ts` trae el catálogo completo en páginas de 100 (tope del validador) y filtra en memoria. Con ~120 motos la búsqueda es instantánea; **si el catálogo llega a unos pocos miles hay que mover búsqueda, orden y paginación a la query**.

**Estado de publicación derivado.** El backend no tiene campo `status`, solo `available` y `featured`. `lib/motorcycle-status.ts` deriva tres estados de los datos que ya hay: `publicada`, `incompleta` (le falta precio, portada, marca o kilometraje) y `fuera del sitio` (`available: false`). Si algún día el backend expone un `status` real, esto se reemplaza por él.

**Alertas de papeles.** SOAT y tecnomecánica son los únicos datos que caducan solos. `getPaperwork` los clasifica en vigente / por vencer (≤ 30 días) / vencido / sin registrar, y la lista muestra el peor de los dos más una franja de resumen arriba. Solo aplica a motos usadas.

**Falta un campo de matrícula.** El tipo `Motorcycle` no tiene placa, aunque el catálogo legacy la lleva dentro del texto libre de `description` (ver `../docs`). Mientras no exista, la lista identifica la moto por miniatura, nombre, marca, año y kilometraje, y el buscador no puede buscar por placa.

**Marcar como vendida, no eliminar.** La acción principal de una moto vendida es apagar `available` — sale del sitio y el registro queda. Eliminar está al final del menú, separada y con confirmación que nombra la moto; desde la Fase 1 **manda a la papelera**, no borra (ver «Gestión de medios → Papelera»).

**Nombre en la interfaz.** El paquete se sigue llamando `yamaha-oriente-cms-admin` (herencia de la plantilla), pero la interfaz dice «Motos Hot Wheels» porque el catálogo es multimarca. Renombrar el paquete es aparte.

**`features` y `colors` se editan con `ListaEditable`, no con texto separado por comas** (desde la Fase 7). Motos fue la última sección en arrastrar el campo de comas que `servicios` ya había dejado atrás en la Fase 3 — mismo componente, mismo criterio: el orden es el dato y una coma dentro de un renglón ya no parte nada en dos sin avisar.

### Decisiones del módulo `puntos-de-atencion`

> Construido en la **Fase 2 del plan CMS** (`../docs/cms-plan/phases/02-puntos-de-atencion.md`), la primera sección hecha entera sobre `PATRON.md`.

**Un punto de atención tiene siete campos**, y ni uno más: nombre, dirección, teléfono, correo, WhatsApp, horarios y ubicación (más `slug` y `type`). **`services`, `image` y `featured` se descartaron** —eran de la plantilla Yamaha— y por eso tampoco salen en la página pública. Las columnas siguen en la tabla, sin usar.

**El tipo es un catálogo cerrado** (`SEDE`, `CONCESIONARIO`, `DISTRIBUIDOR`): desplegable en la ficha y filtro fiable en la lista. Los valores salen de lo que publica el sitio legacy. Agregar uno toca `ETIQUETAS_TIPO` en `app/(admin)/puntos-de-atencion/filters.ts` y tres sitios del backend (ver `backend/CLAUDE.md`).

**La ubicación se captura pegando el enlace de Google Maps**, no escribiendo coordenadas. La ficha avisa mientras se escribe si el enlace trae coordenadas (`lib/maps-url.ts`, una copia del extractor del backend **solo para el aviso**: quien las guarda es el backend). Los enlaces cortos `maps.app.goo.gl` no las traen y el sitio queda con «Cómo llegar» sin mapa.

**Los horarios se editan día por día** (`hours-editor.tsx`): un interruptor y dos `<input type="time">` por día, con «Copiar a los demás» para no escribir seis veces lo mismo. **Un día apagado está cerrado**; no se guarda ninguna bandera. `lib/service-point-hours.ts` tiene el formato y el resumen de una línea que usa la lista.

**La papelera es un valor del filtro de estado** (`En el sitio` / `En papelera`), igual que en motos y en medios. En la papelera la fila muestra la píldora y el menú se reduce a *Restaurar al sitio* / *Eliminar definitivamente*.

**El buscador vive en la fila de filtros de cada lista**, con su propio placeholder (`lib/list-search.ts`, mapa `BUSCADORES`). **Toda lista nueva con búsqueda tiene que agregarse a ese mapa** y pasarle `busqueda` a su `BarraFiltros`.

### Decisiones del módulo `servicios`

> Construido en la **Fase 3 del plan CMS** (`../docs/cms-plan/phases/03-servicios.md`).

**La sección arranca vacía a propósito.** Los seis servicios del mock eran de plantilla y **no se cargaron**: los reales los escribe el usuario. Por eso el vacío importa tanto como la lista — el panel invita a crear el primero y `/servicios` en el sitio dice «Estamos organizando nuestros servicios» con un enlace a los puntos de atención, en vez de una rejilla en blanco.

**El precio tiene tres modalidades**, elegidas con un desplegable en la ficha: *desde un monto*, *precio fijo* y *a convenir*. Con «a convenir» el campo del monto **se apaga en vez de esconderse**, para que no parezca que el campo se perdió, y lo que quede escrito no se guarda. La nota libre («cada 5.000 km», «según el daño») es lo que en el mock se llamaba `frequency`. La moneda es COP y no se pregunta. El formato de lectura vive en `lib/service-pricing.ts`.

**El icono se elige de una rejilla con vista previa** (`servicios/icon-picker.tsx`), nunca se escribe: son 26 iconos de `lucide-react` con etiquetas de taller («Frenos», no «Disco»). **Los emojis del mock no se conservaron.** El catálogo está en `lib/service-icons.ts` y ahí mismo dice cómo se amplía — hay que tocar también el espejo del sitio, `web/src/utils/service-icons.tsx`.

**`features` y `benefits` se editan con `ListaEditable`, no con texto separado por comas.** El orden es el dato: es el que ve el cliente en el sitio, y con comas mover el tercer renglón al primer lugar obliga a reescribir la línea entera (además, una coma dentro de un renglón lo parte en dos sin avisar). Motos todavía usa el campo con comas para sus `features`; migrarlo está anotado en `MEJORAS.md`.

**La categoría es texto libre con sugerencias**, no un catálogo cerrado como el tipo de un punto de atención: el usuario está inventando su lista y no puede depender de un despliegue para nombrar una categoría nueva. La ficha sugiere las que ya existen (`datalist`) y el filtro de la lista se arma con ellas.

El módulo `medios` (biblioteca de imágenes) sigue el mismo patrón de lista, con la papelera dentro del filtro de estado.

### Decisiones del módulo `noticias`

> Construido en la **Fase 4 del plan CMS** (`../docs/cms-plan/phases/04-noticias.md`), la sección con contenido largo y fecha de publicación.

**El estado no lo guarda el backend: se deriva de `publishedAt`**, igual criterio que `lib/motorcycle-status.ts`. `lib/news-status.ts` (`getNewsStatus`) calcula tres estados — **borrador** (sin fecha), **programada** (fecha futura) y **publicada** (fecha de hoy o antes) — comparando contra el instante real (`Date.now()`), la misma regla exacta que aplica el resolver del backend (`publishedAt <= now()`). El filtro de estado de la lista tiene estos tres valores más «Todas» y, como en el resto de los módulos, «En papelera» como un cuarto valor que dispara otra consulta (PATRON.md §1.1) — aquí son **cinco** valores en vez de dos, porque a diferencia de `service`/`service-point` la fecha sí importa para saber si algo está en el sitio.

**El editor de contenido es enriquecido (Tiptap), no Markdown en textarea.** Se acordó con el usuario al construir la fase — el documento la dejaba como decisión abierta. `components/admin/rich-text-editor.tsx` envuelve `@tiptap/react` + `@tiptap/starter-kit` (que ya trae negrita, cursiva, subrayado, tachado, encabezados, listas, cita, enlace y deshacer/rehacer) con una barra de herramientas propia de 44 px en móvil. Guarda **HTML**, tal como lo produce `editor.getHTML()` — el formato nativo de la librería, sin una capa de conversión intermedia. El propio esquema de Tiptap ya limita lo que puede producirse (pegar HTML de otro sitio no cuela un `<script>`: ProseMirror lo descarta al convertir el HTML pegado a su documento interno), y el backend sanea otra vez al guardar — ver `backend/CLAUDE.md`, sección `news`.

**El slug sigue al título y el tiempo de lectura sigue al contenido**, los dos mientras nadie los haya tocado a mano (mismo gesto que el slug en `motos`/`servicios`, vía el parámetro `derivar` de `useFichaState`). `lib/news-status.ts` también trae `tiempoDeLecturaSugerido`: cuenta palabras del HTML (quitando etiquetas) a 200 palabras por minuto y redondea a un mínimo de 1 minuto. Es solo una sugerencia — el campo sigue siendo de texto libre y editable.

**`author` es solo el nombre** (texto libre) e **`image` es solo la URL de la portada** (`ImagePicker`, como cualquier imagen única del panel). La plantilla original traía `author: { name, avatar }` e `image: { main, thumbnail, alt }`; se simplificaron en el backend (migración `009`) porque el avatar nunca tuvo archivos reales y el pipeline de medios no genera una miniatura aparte — ver el detalle en `backend/CLAUDE.md`.

**`category` es texto libre con sugerencias**, mismo criterio que `service` y por la misma razón: el usuario inventa su lista y una categoría nueva no puede depender de un despliegue.

**`tags` se edita con `ListaEditable`**, pero a diferencia de `features`/`benefits` de `service` el orden no significa nada — son etiquetas sueltas, no pasos ni beneficios. Se reusa el mismo componente porque agregar/quitar renglones cortos es exactamente lo mismo; mover uno arriba o abajo simplemente no cambia nada en el sitio.

**La ficha guarda `publishedAt` como fecha de calendario** (`<input type="date">`, igual que las fechas de SOAT/tecnomecánica de `motos`), convertida a medianoche UTC al guardar (`"${fecha}T00:00:00.000Z"`). Una fecha en blanco viaja como `null` explícito en la edición, no como «sin cambios»: es lo que permite devolver una noticia publicada a borrador sin tocar ningún otro campo. **Toda lectura de esa fecha tiene que forzar `timeZone: 'UTC'`** al formatearla (`lib/format.ts` ya lo hace) — sin eso, alguien en una zona detrás de UTC (Colombia, UTC-5) ve la fecha un día antes de la que eligió. Se encontró y se corrigió el mismo bug en `web` al verificar esta fase (`web/src/app/noticias/page.tsx` y `.../[slug]/page.tsx`).

**A diferencia de `servicios` y `puntos-de-atencion`, una noticia sí tiene página propia** (`/noticias/<slug>`), así que `urlPublicaDeNoticia` en `lib/site.ts` no necesita un `#slug` de ancla. El menú de la fila la ofrece igual estando en borrador o programada — el enlace puede llevar a un 404 hasta que se publique, y eso ya lo dice la píldora de estado de la fila, no hay que escondérselo a quien administra.

### Decisiones del módulo `banners`

> Construido en la **Fase 5 del plan CMS** (`../docs/cms-plan/phases/05-home-y-banners.md`), la primera sección sobre una tabla nueva del backend y la primera con orden manual.

**Alcance original, ampliado después.** La Fase 5 solo administraba el carrusel del home; el segundo banner ancho quedaba fijo en `web`. Fue un pedido explícito del usuario en `docs/cms-plan/MEJORAS.md` ("la administración de banners solo cubre el carrusel del home") lo que agregó `slot` (`HOME` | `SECUNDARIO`, catálogo cerrado — ver `backend/CLAUDE.md`): ahora este módulo administra los dos, y la lista muestra un slot a la vez (selector "Dónde aparece" en `BannersFilters`). Los **títulos de cada sección de la home** (`Motos Destacadas`, `Servicios Yamaha`...) siguen fijos en el código — eso no cambió, y sigue sin ficha en ningún módulo.

**`position` es por slot, no global.** Cada slot es su propio carrusel con su propio orden: `nextPosition` y `bannerReorder` (ahora `bannerReorder(slot, ids)`) operan dentro de un slot, nunca across. Un banner de `HOME` en posición 0 y uno de `SECUNDARIO` en posición 0 no compiten entre sí.

**No hay selector de "ordenar por".** A diferencia de todas las listas anteriores, `filters.ts` no tiene `orden`: el orden siempre es `position`, porque el orden *es* el dato que se edita — un desplegable de orden competiría con subir/bajar. Por el mismo motivo tampoco hay `q` de búsqueda por texto libre ligado a filtros de contenido más allá del título/subtítulo/enlace, y **reordenar se deshabilita mientras hay una búsqueda activa** (`page.tsx`, `puedeReordenar`): con la lista filtrada, la vecina de una fila en pantalla puede no ser su vecina real, y mover algo que no se ve confundiría más que ayudar.

**Subir/bajar, no arrastrar.** El documento de la fase pedía arrastrar con una nota de riesgo en móvil; se optó directamente por los mismos botones de 44 px que ya usa `ListaEditable` para `features`/`benefits`, sin agregar una librería de drag-and-drop nueva al proyecto — mismo criterio, misma pieza visual (`ArrowUp`/`ArrowDown`), ahora también en `banner-row.tsx`. Los botones operan sobre el **orden real** (`ordenados`, todo el catálogo sin filtrar), no sobre la página visible, así que una lista de más de 25 banners seguiría reordenándose bien aunque `ListaResponsive` la corte en páginas — hoy es un escenario de sobra, un carrusel de portada no tiene decenas de banners.

**El reordenar es una mutación propia, `bannerReorder(ids)`**, no una serie de `bannerEdit` por fila: manda el orden completo de una vez (transacción en el backend) para que no quede un estado intermedio si algo falla a mitad de camino.

**`position` no está en la ficha.** Un banner nuevo se agrega al final (lo decide el backend); moverlo es cosa de la lista, no de `banner-form-sheet.tsx`.

**Vigencia con dos fechas opcionales**, mismo patrón que `publishedAt` de noticias: `<input type="date">` en las dos puntas, `''` viaja como `null` explícito al guardar (para poder volver a "siempre vigente"), y el estado que ve quien administra (`lib/banner-status.ts`, `getBannerStatus`) deriva **visible / inactivo / programado / vencido** comparando contra `Date.now()` — la misma regla que aplica el resolver del backend para decidir qué ve el sitio público.

**El buscador solo busca por título.** `banners` está en el mapa `BUSCADORES` de `lib/list-search.ts`, pero a diferencia de `servicios`/`noticias` no tiene filtro de categoría ni de destacado: con un puñado de banners promocionales, más filtros solo estorbarían.

**La barra inferior de móvil dejó de asumir cinco destinos fijos.** Hasta esta fase `navLinks` tenía exactamente cinco entradas y `admin-tabbar.tsx` las pintaba todas. Con `banners` como sexta, `AdminTabBar` ahora corta en los primeros cinco (`DESTINOS_BARRA`) y el resto —hoy, `medios`— se ve en `MoreSheet`, que ganó una lista de enlaces arriba de "Apariencia". `AdminRail` (escritorio) no cambió: ya recorría `navLinks` completo por grupo.

### Decisiones del módulo `configuracion`

> Construido en la **Fase 6 del plan CMS** (`../docs/cms-plan/phases/06-configuracion-sitio.md`), la primera (y única) sección que **no es una lista**: `site_settings` es un registro único, se edita, no se crea ni se elimina.

**No hay `page.tsx` con `ListaResponsive` delante.** `/configuracion` entra directo a la ficha: no hay `filters.ts`, `<x>-row.tsx`, `<x>-actions.tsx` ni `<x>-filters.tsx` — nada de eso tiene sentido sin una lista. Tampoco hay papelera: `site_settings` no tiene `deleted_at` (ver `backend/CLAUDE.md`).

**`FormSheet` no se reutiliza tal cual, `useFichaState` sí.** `FormSheet` es una hoja lateral que se abre desde una fila y se cierra volviendo a la lista — aquí no hay a dónde volver, así que `site-settings-form.tsx` reimplementa el mismo armazón visual (pestañas con contador de errores, barra de guardado fija) **sin el `<Sheet>`** ni el botón «Cerrar» ni el aviso de «¿Descartar los cambios?» (no tiene sentido preguntar si no hay nada a lo que volver). Lo que sí se reutiliza tal cual es `useFichaState`, con `open: true` fijo — la ficha nace abierta y se queda abierta toda la vida de la página.

**El `registro` de la ficha lo controla el propio componente, no la query directamente.** `page.tsx` guarda la fila en un `useState<SiteSettings | null>` que solo se actualiza (a) la primera vez que llega la consulta y (b) con la respuesta de `siteSettingsEdit` tras guardar — nunca automáticamente en cada refetch de TanStack Query en segundo plano (por ejemplo, al recuperar el foco de la ventana). Si se hubiera atado `registro` directo a `data` de `useQuery`, un refetch a mitad de una edición sin guardar habría reseteado el formulario y borrado lo que se estaba escribiendo, porque `useFichaState` recarga el formulario cada vez que cambia la referencia de `registro`.

**Nueva entrada de navegación, grupo propio.** `nav-links.ts` ganó un tercer grupo, `'Sistema'` (antes solo `'Catálogo'` y `'Contenido'`), porque `/configuracion` no es ni catálogo ni contenido del sitio. Con Configuración como séptima entrada, sigue desbordando a `MoreSheet` en móvil junto con Medios (ver «Decisiones del módulo `banners`» arriba: `AdminTabBar` corta en las primeras cinco).

**Contacto, redes, SEO y textos — cuatro secciones, en ese orden**, el mismo del documento de la fase. `whatsapp` es el único campo genuinamente nuevo (no existía configuración de WhatsApp a nivel de sitio); el resto mueve texto que ya estaba quemado en `web` (ver `backend/CLAUDE.md`, sección `site-settings`, para qué se sembró y por qué dos valores son placeholder).

**Validación de formato en tres campos**, con el mismo criterio que el Zod del backend dicho en el idioma de la ficha (`site-settings-form-state.ts`): correo (`email`), URL completa para los cuatro enlaces sociales, la imagen de SEO y el logo, y cantidad de dígitos para WhatsApp. El campo de correo usa `type="email"`, así que el navegador ya bloquea un `hola@` con su propio aviso nativo antes de que el JS del formulario llegue a evaluar Zod — el mensaje «Correo inválido» de Zod es la segunda línea de defensa (por ejemplo, para un valor que pase la validación nativa del navegador pero no la de Zod), no la única.

**«Textos» ganó un segundo campo, `logo`, después de la Fase 6** (pedido en `docs/cms-plan/MEJORAS.md`): un `ImagePicker` igual que `seoImage`, con la misma limitación de imagen opcional (se reemplaza, no se limpia desde la ficha — sin valor, `web` sigue usando el logo de Yamaha por defecto).

**`seoKeywords` se edita con `ListaEditable`**, igual que `tags` de una noticia: es una lista sin orden relevante, se reusa el componente porque agregar/quitar renglones cortos es lo mismo, aunque mover uno arriba o abajo no cambie nada.

**Los campos de texto opcionales heredan la misma limitación que las imágenes**: `formToInput` usa `textoOpcional` (`"" → undefined`), así que un campo que ya tiene valor no se puede vaciar desde la ficha, solo reemplazar por otro valor — mismo criterio documentado para `image`/`imageMobile` en motos, servicios, noticias y banners. `seoKeywords` es la excepción: al ser un arreglo, `[]` es un valor legítimo que sí viaja y sí limpia la lista.

### Fase 7 — QA y cierre del CMS

No agregó ningún módulo: recorrió los seis ya construidos, arregló lo que
chirriaba de verdad y volcó el resto en `../docs/cms-plan/MEJORAS.md`. Lo que
cambió en esta capa:

- **Los `<Select>` volvieron a medir lo que su `className` pedía** (ver la nota
  de especificidad en «Sistema de diseño» arriba) — afectaba a los filtros de
  las seis listas y a los desplegables de `motos`, `puntos-de-atencion` y
  `servicios`.
- **`motos` dejó de ser la única sección con listas de texto separado por
  comas**: `features` y `colors` pasaron a `ListaEditable` (ver arriba).
- **El buscador global se oculta en secciones sin lista** (`tieneBuscador()`,
  ver «Estructura del panel» arriba), en vez de caer en `/motos` sin avisar.
- **Se borró código muerto**: `components/admin/proximamente.tsx` (ya no lo
  usaba ningún módulo, todos tienen backend desde hace fases) y, en `web`,
  `BannerWrapper.tsx` y `OptimizedHero.tsx` del scaffold original.

Lo que se revisó y **no** se tocó, con el porqué en `MEJORAS.md`: que un campo
de imagen opcional no se pueda limpiar desde la ficha (solo reemplazar), que
`/servicios` y `/puntos-de-atencion` abran el detalle en un modal en vez de una
página propia, y que `web/public/manifest.json` no lea `site_settings` — las
tres son trabajo real de una fase propia, no un arreglo de QA, o dependen de
un `next build` de producción que no se podía correr con los `dev` de por
medio (ver «Riesgos» del documento de la Fase 7).

El patrón de **traer la página completa (hasta `LIMITE_BACKEND = 100`) y
filtrar/ordenar/paginar en el cliente** —documentado como decisión de `motos`
más arriba— resultó ser, al revisar los seis `use-<dominio>.ts`, el patrón de
**todo** el panel, no una excepción de motos: ninguna query de lista del
backend busca ni ordena, así que no había otra forma de construirlo con el
`PATRON.md` actual. Con los volúmenes reales de hoy (30 motos, 9 noticias, 5
puntos, 3 banners, 3 imágenes, 1 servicio) cada consulta al backend tarda de
un dígito de milisegundos; el límite sigue siendo el mismo que ya advertía
`motos`: si algún catálogo llega a los miles, hay que mover búsqueda, orden y
paginación a la query en esa sección.

## Recorridos guiados (tours)

> Cimientos construidos en la **Fase 0 del plan de tours** (`../docs/tours-plan/PLAN.md`). Librería: **driver.js** (~5 kB, sin dependencias, agnóstica del framework).

Cada sección del panel se explica sola la primera vez que se entra. El progreso vive en la base (`tour_progress`, ver `../backend/CLAUDE.md`), no en `localStorage`: sobrevive al navegador y al equipo. Se reinician desde **Configuración → Ayuda y recorridos**.

| Pieza | Archivo | Qué resuelve |
| --- | --- | --- |
| `TOURS`, `ClaveTour` | `lib/tours/registry.ts` | El catálogo de recorridos: claves, versiones, pasos y textos. Todo lo que existe está aquí. |
| `tourAnchor`, `selectorTour`, `anclaVisible` | `lib/tours/anchor.ts` | El anclaje `data-tour`, en una sola forma de escribirlo y de buscarlo. |
| `runTour` | `lib/tours/run-tour.ts` | El envoltorio de `driver.js`: filtra pasos, decide terminado vs. saltado, aplica el tema. |
| `TourProvider`, `useTour`, `useTourContext` | `lib/tours/tour-provider.tsx` | Quién decide si un recorrido se muestra. Va en `AdminShell`. |
| `useTourProgressQuery`, `useTourMutations` | `lib/tours/use-tour-progress.ts` | La consulta (una vez por sesión) y las mutaciones. |
| `AyudaYRecorridos` | `app/(admin)/configuracion/ayuda-y-recorridos.tsx` | El reinicio, fuera del formulario de configuración. |

**Agregar un recorrido a una sección** son tres cosas: definirlo en `registry.ts`, colgar los `data-tour` con `tourAnchor()` en los elementos que señala, y llamar `useTour('clave', listo)` en la página. El provider hace el resto.

**Las reglas que ya están resueltas y no hay que volver a resolver por sección.**

**Las anclas son `data-tour`, nunca clases de Tailwind.** Una clase cambia con cualquier retoque visual y nadie se entera de que rompió un recorrido; un `data-tour` está ahí a propósito y sale en el `grep`.

**Un paso cuya ancla no está en el DOM se salta en silencio** (`anclaVisible`, más `skipMissingElement` como red). El recorrido de una lista vacía no puede reventar. Se filtra **antes** de arrancar para que el contador diga «2 de 4» de verdad, y `anclaVisible` mide tamaño además de existencia porque en este panel «no existe en esta pantalla» casi siempre se escribe `hidden md:flex`.

**Nunca se arranca sobre un esqueleto de carga.** El segundo argumento de `useTour` es la condición de que la pantalla ya se pueda explicar (`!isLoading && !isError`).

**Uno a la vez, y una vez por sesión de navegador.** Lo que llega mientras hay un recorrido corriendo espera en la cola; `lanzados` (un `Set` en el provider) evita que volver a la misma pantalla —o el doble montaje de React en desarrollo— relance lo ya mostrado.

**Cambiar de ruta cancela sin marcar visto**, para que el recorrido pueda volver a salir. Cancelar no es decidir: `runTour` distingue el cierre del usuario (`onDestroyStarted`, que `driver.js` solo dispara en botón/Esc/clic fuera) del `destroy()` programático nuestro, y solo el primero marca.

**Marcar visto es optimista y silencioso**; reiniciar sí avisa. Si falla marcar, el peor caso es que el recorrido salga una vez más — no hay razón para interrumpir a nadie con un error por eso.

**Máximo 5 o 6 pasos por recorrido.** Es una regla, no una sugerencia: uno largo lo salta todo el mundo, y saltar también cuenta como visto, con lo cual el usuario se queda sin la ayuda para siempre. Lo que no cabe en 6 pasos son dos recorridos.

**Actualizar un recorrido = subir su `version` en `registry.ts`**, no borrar filas: vuelve a salir para todos sin borrarle el historial a nadie.

**Los estilos del popover se reescriben en `globals.css` (`.driver-popover.tour-panel`).** La hoja que trae la librería tiene los colores quemados para fondo blanco; sin ese bloque, el recorrido se ve como una pieza ajena y en tema oscuro queda ilegible.

## Dev

```bash
pnpm --filter yamaha-oriente-cms-admin dev   # http://localhost:3001
```

Requiere `../backend` corriendo en `http://localhost:8080` (`npm run docker:up` en `backend/`). URL configurable con `BACKEND_GRAPHQL_URL` (ver `.env.example`).

## Gestión de medios

> Construido en la **Fase 1 del plan CMS** (`../docs/cms-plan/phases/01-medios.md`).

**Sí hay subida de imágenes.** Ningún campo de imagen es un `<Input>` de URL: se usa `components/admin/image-picker.tsx`, que trae dos componentes sobre el mismo motor —`ImagePicker` (una imagen) y `GaleriaImagenes` (varias, con portada y orden)—. Los dos hacen arrastrar y soltar, progreso por foto, `accept="image/*"` (en el teléfono ofrece cámara o galería) y **mantienen el campo de pegar URLs externas**, porque el catálogo legacy tiene fotos alojadas fuera. **También se puede reusar una foto ya subida** con el botón «Elegir de la biblioteca» (`SelectorBiblioteca`, mismo archivo): abre un diálogo con grilla y búsqueda sobre `mediaList`, en modo simple (elegir cierra) o múltiple (elegir varias + confirmar). Pedido explícito en `../docs/cms-plan/MEJORAS.md` — "como en WordPress" — y como es el mismo componente en motos, banners, servicios y noticias, se resolvió una sola vez para los cuatro.

| Pieza | Archivo | Qué resuelve |
| --- | --- | --- |
| `ImagePicker`, `GaleriaImagenes`, `SubidorMedios` | `components/admin/image-picker.tsx` | Los campos de imagen de toda ficha. |
| `useMediaQuery`, `MEDIA_KEY` | `lib/use-media-library.ts` | La consulta paginada a `mediaList`, compartida por `/medios` y `SelectorBiblioteca`. |
| `subirImagen`, `formatBytes`, `formatDimensiones` | `lib/media-upload.ts` | La subida con progreso y los formatos de la biblioteca. |
| `/api/media/upload` | `app/api/media/upload/route.ts` | Reenvía el multipart al backend con el JWT de la cookie. |
| Biblioteca | `app/(admin)/medios/` | Listar, buscar, copiar URL, papelera. |

**Tres decisiones que hay que respetar.**

**La subida no pasa por `/api/graphql`.** Ese proxy lee el cuerpo como texto y tiene su propio límite; los binarios van por `/api/media/upload`, que hace lo mismo con el token pero deja el multipart intacto. La subida usa `XMLHttpRequest` y no `fetch` porque `fetch` no informa progreso de subida, y aquí lo que tarda es subir.

**Se sube de a una foto, en el orden en que se eligieron.** Una moto lleva 16–18 y llegan numeradas: en paralelo se desordenan y ponen a `sharp` a procesar varias a la vez en un droplet chico.

**En el estado de la ficha, una imagen es un `string` con la URL** — no el id del archivo. Así una URL externa y una subida son exactamente el mismo campo. Lo que el backend guarda en el contenido es la URL; la tabla `media` es la biblioteca, no una relación.

### Papelera

Eliminar nunca borra de una vez, ni imágenes ni contenido (`deleted_at` en el backend, ver `../docs/cms-plan/PATRON.md` §1.1).

- **Motos**: «En papelera» es un valor del filtro **estado** en la lista de siempre — no una pantalla aparte. Dispara otra consulta (`trashed: true`) con su propia caché, la fila muestra la píldora «En papelera» y el menú cambia a *Restaurar al catálogo* / *Eliminar definitivamente*.
- **Medios**: la papelera vive dentro de la biblioteca, en el mismo filtro. Una imagen en la papelera **sigue respondiendo su URL**: recién al eliminar definitivamente se borra el archivo del servidor.
- **Quitar una foto de una ficha solo la desvincula**; el archivo queda en la biblioteca. **Eliminar una moto no toca sus archivos.** No hay rastreo de qué ficha usa qué archivo, a propósito.
