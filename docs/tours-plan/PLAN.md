# Plan de tours — recorridos guiados del panel

Plan de construcción, fase por fase, de los recorridos guiados (*tours*) que le
explican a quien administra el sitio qué hace cada rincón del panel. Cada tour
se ve **una sola vez por usuario**, queda registrado en la base de datos, y se
puede volver a ver desde **Configuración → Reiniciar tour**.

## Decisiones ya tomadas

| Decisión | Qué se eligió | Por qué |
|---|---|---|
| Alcance | **Solo `cms-admin`** | Es donde hay sesión y, por tanto, un «usuario» al que atarle el progreso. El sitio público (`web`) no tiene login: ahí «visto una vez» solo podría vivir en `localStorage`, que es otro mecanismo con otro botón de reinicio. Queda fuera del plan. |
| Librería | **`driver.js`** | ~5 kB, sin dependencias, agnóstico de framework y compatible con Next 15 / React 19. Resuelve el recorte del overlay, el scroll al elemento, el foco y el teclado — que es justo lo caro de hacer a mano. MIT. |
| Persistencia | Tabla propia en Postgres | Lo pide el requisito: el «visto» sobrevive al navegador y al equipo desde el que se entra. |

---

## El punto de partida (lo que hay hoy)

Antes de planear hay que decir tres cosas del código actual, porque las tres
condicionan el diseño:

**1. No hay tabla de usuarios.** El admin del panel vive en variables de
entorno (`ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`, ver
[`auth.service.ts`](../../backend/src/services/auth.service.ts)) y su id es la
constante `'1'`. El JWT sí lleva un `sub`
([`shared/auth/jwt.ts`](../../backend/src/shared/auth/jwt.ts)), y **ese `sub` es
la clave por usuario que necesitamos**. La tabla de progreso se apoya en él como
`VARCHAR`, sin llave foránea. El día que exista una tabla `users` de verdad, se
agrega la FK y no hay que migrar ni un dato: el `sub` ya era el id.

> Consecuencia práctica: hoy «cada usuario» significa «el único admin». El
> requisito se cumple igual y el diseño no hay que rehacerlo después.

**2. Los ocho módulos del panel son el mismo módulo.** `motos`,
`puntos-de-atencion`, `servicios`, `noticias`, `banners`, `medios` comparten
`PageHeader` + `filter-bar` + `responsive-list` + `row-actions` + `pagination` +
`form-sheet` (ver [PATRON.md](../cms-plan/PATRON.md)). Eso significa que **el
70 % de los pasos se escribe una vez**, como dos recorridos plantilla — `lista`
y `ficha` — y cada sección solo aporta los pasos de lo que la hace distinta
(los horarios de un punto de atención, los precios de un servicio, los *slots*
de un banner). El plan está ordenado alrededor de ese hecho.

**3. La ficha no es una página, es una hoja (`form-sheet`).** No se puede
recorrer la ficha desde el tour de la lista sin que el tour tenga que abrir la
hoja por el usuario. La salida limpia está en la Fase 1: **son dos tours
distintos**, y el de la ficha se dispara solo cuando el usuario abre una ficha
por primera vez.

---

## Modelo de datos

Una tabla nueva, `tour_progress`. Una fila = «este usuario ya vio este tour».

```sql
CREATE TABLE tour_progress (
  id          UUID PRIMARY KEY,
  user_id     VARCHAR(64)  NOT NULL,   -- el `sub` del JWT
  tour_key    VARCHAR(100) NOT NULL,   -- 'panel.bienvenida', 'motos.lista', ...
  version     SMALLINT     NOT NULL DEFAULT 1,
  status      VARCHAR(20)  NOT NULL DEFAULT 'completed', -- completed | skipped
  seen_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, tour_key)
);
```

Tres campos merecen explicación:

- **`version`** es lo que hace que el sistema no se pudra. Cuando una sección
  cambie de interfaz, su tour cambia de pasos y se le sube la versión **en el
  código**; el tour vuelve a salir para todos sin borrarle el historial a nadie.
  La regla de decisión es una línea: *mostrar si no hay fila, o si
  `fila.version < TOUR.version`*.
- **`status`** distingue «lo terminó» de «lo saltó». Los dos cuentan como visto
  —no se insiste—, pero la diferencia es la única señal que vamos a tener de si
  un tour es útil o es un estorbo.
- **`UNIQUE (user_id, tour_key)`** convierte el guardado en un `upsert`
  idempotente. Marcar visto dos veces no es un error, es un no-op.

**Reiniciar = borrar filas.** `tourReset` sin argumento borra todas las del
usuario; con `key`, solo esa. No hay campo «reiniciado»: la ausencia de fila ya
significa exactamente eso.

### Dominio GraphQL

Sigue [PATRON.md](../cms-plan/PATRON.md) con **una excepción declarada**: aquí
las queries **no** son públicas. El progreso es un dato por usuario, así que la
query también lleva `requireAuth` (el sitio público no lo consume).

```graphql
type TourProgress { tourKey: String!, version: Int!, status: TourStatus!, seenAt: DateTime! }
enum TourStatus { completed, skipped }

extend type Query {
  tourProgress: [TourProgress!]!            # requireAuth
}
extend type Mutation {
  tourSeen(key: String!, version: Int!, status: TourStatus!): TourProgress!  # upsert
  tourReset(key: String): Boolean!          # sin key = todos los del usuario
}
```

---

## Cómo funciona en el panel

**Anclaje: `data-tour`, nunca clases.** Cada elemento que un paso necesita
señalar lleva `data-tour="motos.filtros"` — namespace por sección, punto como
separador. Las clases de Tailwind cambian con cada retoque visual; un
`data-tour` está ahí a propósito y se ve en el `grep`. Un helper
`tourAnchor('motos.filtros')` devuelve el atributo, para que el selector y el
ancla no se escriban en dos sitios.

**Regla dura: un paso sin ancla en el DOM se salta en silencio.** Una lista
vacía no tiene filas, y el tour de una lista vacía no puede reventar. Esto se
resuelve una vez en el envoltorio de `driver.js`, no sección por sección.

**Quién decide arrancar.** Un `TourProvider` colgado de
[`AdminShell`](../../cms-admin/components/admin/admin-shell.tsx) carga
`tourProgress` una sola vez (TanStack Query, `staleTime: Infinity`) y expone
`useTour(key)`. Cada página lo llama y el provider decide.

**Cuándo arranca.** Nunca sobre un esqueleto de carga. La página le pasa al
hook una condición de «ya estoy lista» (`!isLoading && !isError && data`), y el
tour espera. Un tour a la vez: si dos piden, el segundo entra en cola.

**Cuándo se marca visto.** Al terminar **y al saltar o cerrar**. La caché local
se marca al instante y la mutación va detrás; si la mutación falla, no se
bloquea nada — el peor caso es que el tour salga una vez más.

**Cuántos pasos.** Máximo 5 o 6 por tour, y esto es una regla, no una
sugerencia. Un tour de 15 pasos no lo termina nadie; lo saltan, y como saltar
también marca visto, el usuario se queda sin la ayuda para siempre. Lo que no
quepa en 6 pasos es señal de que son dos tours.

**Tono de los textos.** El mismo de los `hint` de las secciones de ficha
(ver [`configuracion/form-sections.ts`](<../../cms-admin/app/(admin)/configuracion/form-sections.ts>)):
español, tuteo, frases cortas, y decir para qué sirve la cosa — no cómo se
llama el widget.

---

## Reiniciar el tour

En **Configuración** entra una sección nueva, **«Ayuda y recorridos»**, con:

- Un botón **«Reiniciar todos los recorridos»**, con diálogo de confirmación.
- La lista de recorridos por sección, cada uno con su estado (visto / saltado /
  sin ver) y su propio reiniciar. Porque «quiero repasar solo el de banners» es
  la petición realista, y borrarlo todo para eso es un martillazo.

Y en paralelo, un botón **«?»** en `PageHeader` que **relanza** el tour de la
sección actual en el momento, sin tocar la base de datos. Es lo que la mayoría
de la gente quiere de verdad; el reinicio es para empezar de cero.

---

## Las fases

| # | Fase | Qué deja funcionando | Estado |
|---|------|----------------------|--------|
| 0 | Cimientos | Tabla, dominio GraphQL, provider, envoltorio de `driver.js`, botón de reinicio. Un tour de humo. | ✅ hecha |
| 1 | Recorridos plantilla | Bienvenida del panel + las plantillas `lista` y `ficha`, probadas en Motos. | ✅ hecha |
| 2 | Catálogo | Puntos de atención y Servicios. | ✅ hecha |
| 3 | Contenido | Noticias, Banners y Medios (incluido el selector de imágenes). | pendiente |
| 4 | Sistema y ayuda | Páginas, Configuración, y el panel «Ayuda y recorridos» completo. | pendiente |
| 5 | Móvil, accesibilidad y cierre | El panel en móvil, teclado y foco, QA final. | pendiente |

El orden no es caprichoso: **las Fases 0 y 1 son el 60 % del trabajo**. De la 2
a la 4, cada sección debería costar poco más que escribir sus textos y colgar
sus `data-tour`, porque la maquinaria ya está. Si la Fase 2 duele, la plantilla
de la Fase 1 quedó mal y hay que volver sobre ella — no improvisar en la
sección.

---

### Fase 0 — Cimientos ✅

**Objetivo.** Que exista toda la tubería, extremo a extremo, con el tour más
tonto posible encima. No se escribe contenido de tours en esta fase.

> **Cómo quedó.** El «tour de humo» no se escribió como andamiaje desechable:
> es `panel.bienvenida` **versión 1**, con los tres elementos del armazón que
> existen en todas las pantallas. La Fase 1 lo amplía y sube la versión a 2 —
> que es exactamente para lo que sirve `version`, y de paso lo demuestra en
> vez de explicarlo. Los archivos y las reglas quedaron documentados en
> [`cms-admin/CLAUDE.md`](../../cms-admin/CLAUDE.md), sección «Recorridos
> guiados», y el dominio en [`backend/CLAUDE.md`](../../backend/CLAUDE.md).

**Alcance.**

1. **Backend.** Migración `015_create_tour_progress_table.sql`, tabla en
   [`schema.ts`](../../backend/src/shared/database/schema.ts), tipos, service
   (`listProgress`, `markSeen` como upsert, `reset`), esquemas Zod, módulo
   GraphQL `tour` con `requireAuth` **también en la query**, registrado en
   `schema.ts` y `resolvers.ts`. Tests del service.
2. **cms-admin.** `driver.js` como dependencia. `lib/tours/` con:
   - el envoltorio (`runTour`) que traduce nuestra definición a `driver.js`,
     filtra los pasos cuyo ancla no está en el DOM, y aplica el tema del panel
     en claro y oscuro;
   - el registro de tours (`key`, `version`, pasos) — vacío por ahora;
   - `tourAnchor()` y el tipo `PasoTour`.
3. **`TourProvider`** en `AdminShell`: carga el progreso, expone `useTour`,
   serializa la cola, marca visto de forma optimista.
4. **Configuración.** Sección «Ayuda y recorridos» con el botón global de
   reinicio (la lista por sección llega en la Fase 4).

**Criterio de aceptación.** Un tour de humo de dos pasos sobre la barra
superior: sale la primera vez que entras al panel, no vuelve a salir al
recargar, y vuelve a salir después de pulsar «Reiniciar». Se comprueba también
en `psql` que la fila aparece y desaparece.

**Riesgos conocidos.** El doble montaje de React en modo estricto durante el
desarrollo puede disparar el tour dos veces — el provider tiene que ser
idempotente desde el primer día, no parchearse en la Fase 5.

---

### Fase 1 — Recorridos plantilla (y Motos como referencia) ✅

> **Cómo quedó, y en qué se apartó de lo escrito abajo.**
>
> **Las anclas terminaron siendo genéricas, no por sección.** `lista.tabla`, no
> `motos.tabla`. Solo hay una lista en pantalla y una ficha abierta a la vez,
> así que no hay ambigüedad — y a cambio los componentes compartidos llevan su
> `data-tour` **una sola vez** y toda sección nueva los hereda sin tocar nada.
> Esto es lo que hace que las fases 2 a 4 sean baratas de verdad.
>
> **Un recorrido por visita: terminar uno ya no encadena con el siguiente.** Lo
> encontró la prueba automatizada del primer ingreso: bienvenida (4 pasos) y
> acto seguido, sin pausa, motos.lista (6) — diez globos de corrido, que es
> justo la pared que el tope de seis pasos existe para evitar. Ahora terminar
> un recorrido vacía la cola; lo que quedó sale la próxima vez que se entre a
> esa pantalla, y el «?» lo tiene a un clic mientras tanto.
>
> **El paso del buscador de la bienvenida no existe**: el panel no tiene
> buscador global — se probó y se quitó hace fases, cada lista tiene el suyo.
> Su hueco lo ocupa el paso que enseña el «?».
>
> **Sin paso de paginación en la plantilla de lista** (son 5 pasos y el tope es
> 6: el que queda vale más para lo propio de cada sección que para explicar
> «anterior / siguiente») y **sin paso de imágenes en la de ficha** (vive tras
> una pestaña que no es la que abre por defecto, así que se saltaría siempre;
> la Fase 3 ya le tiene recorrido propio).
>
> **El paso de la papelera sí entró en la plantilla**, y fue la decisión más
> rentable: es la pieza menos evidente del panel entero y ahora las ocho
> secciones la explican gratis.
>
> **Después, revisándolo, el usuario pidió que el recorrido dijera qué es cada
> opción del menú, no solo que el menú existe** — y tenía razón: la bienvenida
> presentaba tres grupos sin decir qué se administra en ninguna sección. La
> bienvenida subió a **versión 3**: un paso por grupo de la barra lateral, con
> sus secciones y media línea cada una. Esa media línea vive en `navLinks`
> (`descripcion`), no en el recorrido, así que una sección nueva queda
> explicada por el solo hecho de declararse — no hay un texto paralelo que se
> olvide. Para que cupiera sin pasarse del tope de seis pasos, «ver el sitio» y
> «cambiar el tema» se juntaron en uno: dos controles vecinos y triviales que
> gastaban dos pasos de un presupuesto que hacía falta para el menú.

**Objetivo.** Escribir de verdad los tres tours que después se copian: el de
bienvenida y las dos plantillas.

**Alcance.**

1. **`panel.bienvenida`** (4–5 pasos): la barra lateral y sus tres grupos
   (Catálogo / Contenido / Sistema), el buscador, el cambio de tema, y dónde
   está la ayuda. Se dispara al entrar al panel por primera vez, en cualquier
   ruta.
2. **Plantilla `lista`**, parametrizada por sección (nombre, singular, textos
   propios). Pasos: encabezado y botón de crear → filtros y su estado en la URL
   → la tabla y su versión de móvil → las acciones de fila (editar, papelera) →
   la paginación. Anclas en `page-header`, `filter-bar`, `responsive-list`,
   `row-actions`, `pagination`.
3. **Plantilla `ficha`**, que **se dispara al abrir una ficha por primera vez**,
   no desde el tour de la lista. Pasos: la navegación por secciones → un campo
   obligatorio y cómo se avisa el error → el selector de imágenes → guardar.
4. **Motos** como primera sección real: `motos.lista` y `motos.ficha`, más el
   botón «?» en su `PageHeader`.

**Criterio de aceptación.** Entrar por primera vez muestra bienvenida; ir a
`/motos` muestra el tour de lista; abrir una moto muestra el de ficha; ninguno
repite. Y el de lista se comporta bien **con la lista vacía**: los pasos de fila
y paginación simplemente no salen.

**La decisión que se toma aquí.** Cómo se parametriza la plantilla. Si termina
siendo una función que recibe textos y devuelve pasos, bien. Si termina siendo
un objeto de configuración con condicionales dentro, es que las secciones no se
parecían tanto y conviene saberlo ahora y no en la Fase 3.

---

### Fase 2 — Catálogo ✅

> **Cómo quedó.** Las plantillas aguantaron: los cuatro recorridos nuevos son
> los sustantivos de cada sección más sus pasos propios, y `tourDeLista` /
> `tourDeFicha` **no cambiaron**. Era la prueba de la Fase 1 y la pasó.
>
> **Lo que sí hubo que agregar: que un paso pueda abrir su pestaña.** Casi todo
> lo que vale la pena explicar de una ficha vive detrás de una pestaña que no es
> la que abre por defecto —los horarios de un punto, el enlace de Maps, las tres
> modalidades de precio—, así que esos pasos se saltaban siempre y la ficha se
> quedaba explicando solo lo genérico. Un paso ahora declara `seccion` y el
> recorrido abre esa pestaña antes de mostrarlo, devolviendo la ficha a la
> pestaña original al terminar. Es la única vez que este sistema le maneja la
> interfaz al usuario, y se acota a eso.
>
> **Y ahí apareció una trampa de `driver.js` que costó encontrar.** El primer
> intento puso el cambio de pestaña dentro del resolutor del ancla, que parecía
> el sitio natural. Pero `driver.js` resuelve el elemento del paso **siguiente**
> mientras dibuja el actual, para decidir si el botón dice «Siguiente» o
> «Listo»: la ficha saltaba de pestaña un paso antes de tiempo y el paso que se
> estaba leyendo señalaba algo que ya no estaba en pantalla. La sonda lo destapó
> mostrando en qué pestaña estaba la ficha en cada paso. El cambio lo dispara
> ahora la navegación, y los pasos con sección llevan `skipMissingElement: false`
> para que no se descarten mientras su pestaña está cerrada.

**Objetivo.** Validar que la plantilla aguanta dos secciones más sin tocarla.

**Alcance.**

- **Puntos de atención**: plantilla + pasos propios del editor de horarios y del
  tipo de punto (que es obligatorio y define qué se ve en el sitio).
- **Servicios**: plantilla + pasos propios del selector de iconos y de los
  precios.
- Papelera: un paso en la plantilla de lista para el filtro «En papelera», que
  es la pieza menos evidente del panel entero y hoy no se la explica nadie.

**Criterio de aceptación.** Las dos secciones funcionan y **la plantilla de la
Fase 1 no cambió** salvo para admitir pasos extra. Cada tour se ve una vez.

---

### Fase 3 — Contenido

**Objetivo.** Las secciones con interfaz propia de verdad.

**Alcance.**

- **Noticias**: el editor de texto enriquecido, y sobre todo la diferencia entre
  borrador y publicado, que es de donde salen los sustos.
- **Banners**: los *slots*, el orden, y qué banner sale en qué parte del sitio.
- **Medios**: la biblioteca, la subida, la papelera, y el aviso de que eliminar
  un registro **no** borra sus imágenes.
- **Selector de imágenes desde la ficha** (`image-picker`): tour corto propio,
  disparado la primera vez que se abre. Es la funcionalidad más nueva del panel
  y la que más se parece a WordPress sin serlo.

**Criterio de aceptación.** Los cuatro tours corren; el del selector de imágenes
no se pisa con el de la ficha que lo contiene (la cola del provider se gana su
sueldo aquí).

---

### Fase 4 — Sistema y panel de ayuda

**Objetivo.** Cerrar las secciones que faltan y dejar terminado el control de
los tours.

**Alcance.**

- **Páginas**: qué es el contenido editorial suelto y dónde aterriza en el
  sitio.
- **Configuración**: la ficha sin lista delante, y que el registro es único
  —no se crea ni se elimina—, más SEO.
- **«Ayuda y recorridos»** completo: la lista de todos los recorridos con su
  estado y su reinicio individual, además del global de la Fase 0.

**Criterio de aceptación.** Desde Configuración se ve el estado real de los
recorridos (visto, saltado, sin ver), se reinicia uno solo y solo vuelve ese.

---

### Fase 5 — Móvil, accesibilidad y cierre

**Objetivo.** Que el tour no sea una cosa de escritorio con una versión rota en
el teléfono.

**Alcance.**

- Pasos marcados como `solo: 'escritorio' | 'movil'`, porque la barra lateral no
  existe en móvil y la barra inferior y la hoja «Más» no existen en escritorio.
- Comprobar el scroll y el recorte del overlay en pantallas pequeñas, y con la
  hoja de ficha abierta.
- Teclado y foco: `Esc` cierra y marca saltado, `Tab` no se escapa fuera del
  popover, y el lector de pantalla anuncia el paso.
- `prefers-reduced-motion`.
- QA de las 8 secciones en claro y oscuro, y en los dos tamaños.
- Documentación corta en [PATRON.md](../cms-plan/PATRON.md): **una sección nueva
  del CMS nace con su tour**, igual que nace con su soft delete. Si no queda
  escrito ahí, la sección número nueve no lo va a tener.

**Criterio de aceptación.** El recorrido completo, de bienvenida a
configuración, hecho entero en un teléfono sin encontrar un paso que señale algo
que no se ve.

---

## Lo que este plan no hace

- **No toca el sitio público.** Decidido arriba.
- **No hace tours ramificados ni interactivos** («ahora pulsa aquí para
  continuar»). Todos avanzan con Siguiente. Se puede añadir después; empezar por
  ahí multiplica el coste de cada tour por tres.
- **No mide nada.** El campo `status` deja la puerta abierta a saber qué tours
  se saltan, pero no hay analítica en este plan.
- **No traduce.** Todo en español, como el resto del panel.
