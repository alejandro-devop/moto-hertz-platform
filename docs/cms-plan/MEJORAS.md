# Mejoras y deuda — para después del plan CMS

Lo que **no** entra en las fases del plan, pero que quedó identificado mientras
se construía. Dos tipos de cosa conviven aquí a propósito:

- **Mejoras**: cosas que el producto no tiene y valdría la pena que tuviera.
- **Deuda**: cosas que están mal o a medias, y sabemos por qué.

Un pendiente escrito es una decisión; uno no escrito es un olvido. Cuando algo
de esta lista se haga, se borra de aquí — no se marca, se borra, y el commit
queda como registro.

> La Fase 7 (`phases/07-qa-y-cierre.md`) alimenta este documento con lo que
> encuentre en el recorrido final del CMS.

---

## Bloqueantes

Cosas que hoy impiden algo real.

### `web` no compila para producción

`web/src/components/menu/Menu.module.scss:323` usa `:global(body)`, y Next lo
rechaza: *"pure selectors must contain at least one local class or id"*. En
desarrollo no molesta, así que pasó desapercibido, pero **bloquea el despliegue
del sitio público**.

Viene del scaffold original (`2ae3829`), no de ninguna fase del plan CMS. Es una
línea, pero toca el menú global de todo el sitio: hay que mirar qué estaba
intentando hacer ese selector antes de moverlo.

### `pnpm lint` está roto en `cms-admin`

`@typescript-eslint` 6.21 con ESLint 9.39 revienta al cargar la regla
`no-unused-expressions`:

```
TypeError: Cannot read properties of undefined (reading 'allowShortCircuit')
```

Es incompatibilidad de versiones, no de código. Mientras tanto la verificación
se hace con `npx tsc --noEmit` y `next build`, que sí pasan — pero eso significa
que **nadie está corriendo las reglas de lint sobre el panel**.

---

## Mejoras del panel

### Ficha por pasos guiados en vez de pestañas

Hoy la ficha de cada sección es un `FormSheet` con pestañas (Identidad,
Contacto, Ubicación, Horarios…). Funciona para quien ya sabe qué va en cada
una, pero **no guía a nadie**: al crear un registro nuevo, las pestañas no dicen
por dónde empezar ni cuánto falta, y es fácil guardar algo a medias sin darse
cuenta de que la cuarta pestaña estaba vacía.

La propuesta es convertirlo en un asistente que lleve de la mano paso a paso.

**El matiz que hay que respetar al implementarlo**: crear y editar no quieren lo
mismo.

| | Crear | Editar |
|---|---|---|
| Qué quiere el usuario | Que le digan qué sigue | Ir directo al campo que viene a cambiar |
| Forma correcta | Asistente por pasos, con progreso y siguiente/atrás | Pestañas, como hoy |

Un asistente forzado al editar es un castigo: hacer cuatro clics para corregir
un teléfono. Así que lo razonable es **asistente al crear y pestañas al
editar**, compartiendo las mismas secciones y el mismo estado de formulario. El
armazón (`components/admin/form-sheet.tsx`) ya conoce las secciones y sabe en
cuál cae cada error, que es la mitad del trabajo.

Detalles a definir: si se puede saltar pasos, si el último paso es un resumen
antes de guardar, y qué pasa si el usuario cierra a mitad del asistente.

### Guías interactivas por módulo

Cada sección del panel tiene decisiones que no son obvias a la primera: que un
día sin encender está cerrado, que la portada de una moto es la primera foto de
la lista, que la papelera vive dentro del filtro de estado, que el enlace corto
de Google Maps no trae coordenadas. Hoy eso solo lo sabe quien lo construyó o
quien lea los `CLAUDE.md`.

Un recorrido guiado por módulo —lanzable desde un botón de ayuda, y ofrecido
solo la primera vez— resuelve eso sin llenar la interfaz de textos.

**Sobre la librería.** Verifica la compatibilidad con React 19 y Next 15 en el
momento de implementarlo; este ecosistema se mueve y esta nota puede estar
vieja:

| Opción | A favor | En contra |
|---|---|---|
| **driver.js** | Diminuta, sin dependencias, agnóstica del framework — no se rompe cuando React saca una versión mayor | El estado del recorrido lo manejas tú |
| **react-joyride** | La más conocida del mundo React, muchos ejemplos | Históricamente lenta en soportar versiones nuevas de React; comprobar antes de casarse |
| **@reactour/tour** | API de React limpia, mantenida | Comunidad más pequeña |
| **intro.js** | Muy completa | **Licencia comercial de pago** para uso empresarial — descartarla salvo que se compre |

Recomendación de partida: **driver.js**, precisamente porque no se acopla a la
versión de React. El panel ya tiene dónde colgar el botón de ayuda
(`components/admin/admin-topbar.tsx`).

Lo que hay que decidir: dónde se guarda "este usuario ya vio el recorrido de
motos" (hoy no hay tabla de usuarios; `localStorage` alcanza), y si el recorrido
se actualiza solo cuando el módulo cambia o hay que reescribirlo a mano.

### Elegir una imagen ya subida desde la ficha

El selector de imágenes sube archivos nuevos o acepta una URL pegada, pero **no
deja escoger algo que ya está en la biblioteca**. Para reusar una foto hay que
ir a `/medios`, copiar la URL y volver. Es el hueco más visible que dejó la
Fase 1; un diálogo "Elegir de la biblioteca" dentro de
`components/admin/image-picker.tsx` es trabajo de una tarde.

### `motos` sigue editando sus listas con comas

Desde la Fase 3 existe `components/admin/list-editor.tsx` (`ListaEditable`), que
edita una lista con orden: agregar, quitar, subir y bajar. `motos` todavía usa
`listaDesdeTexto`/`textoDesdeLista` para `features` y `colors`, es decir un
campo de texto separado por comas — donde una coma dentro de un renglón lo parte
en dos sin avisar y reordenar obliga a reescribir la línea.

Cambiarlo es sustituir dos campos en `motorcycle-form-sheet.tsx` y ajustar el
estado plano para que guarde `string[]` en vez de `string`.

### El buscador de la barra superior no se esconde en `/configuracion`

`/configuracion` (Fase 6) es la primera sección del panel sin lista ni
búsqueda: no está en el mapa `BUSCADORES` de `admin-search.tsx`, así que ahí
el buscador global cae en el destino por defecto (`/motos`) con su placeholder
("Buscar por nombre o matrícula"). Escribir algo ahí saca al usuario de
Configuración sin avisar. No se resolvió en esta fase porque `AdminSearch`
asume que toda sección tiene una lista que buscar — resolverlo bien implica
decidir qué hace el buscador (u ocultarlo) en cualquier sección futura que
tampoco tenga lista, no solo en esta.

### Los desplegables de filtro miden 32 px, no 44

`cms-admin/CLAUDE.md` manda objetivos de 44 px en móvil (`h-11 md:h-9`), pero la
clase base de `SelectTrigger` (`data-[size=default]:h-8`) gana en la cascada
sobre el `h-11` que se le pasa. Afecta a los filtros de **todas** las secciones
y se hereda a cada módulo nuevo. Se arregla en `components/ui/select.tsx`, con
una variante propia o pasando la altura como `data-size`.

Es previo al plan CMS y se ha ido arrastrando fase tras fase. Cuanto más se
espere, más módulos hay que volver a verificar.

---

## Sitio público

### Una moto inexistente o en papelera renderiza una página casi vacía

No devuelve 404 ni dice "no encontrada": pinta el armazón sin contenido. Se
destapó al construir la papelera en la Fase 1, pero es comportamiento previo de
`web`. Hay que revisar el resto de rutas de detalle por lo mismo.

### Los servicios no tienen página propia

`/servicios` los muestra en tarjetas y abre el detalle en un modal, que fue como
lo dejó la plantilla. No hay `/servicios/[slug]`, así que **un servicio no se
puede enlazar ni indexar**: el panel enlaza a `/servicios#<slug>`, que lleva a
la tarjeta pero no abre el detalle. La query `service(slug:)` ya existe en el
backend y en `web/src/services/services.ts`, sin usar — la página sería lo único
que falta. Lo mismo aplica a los puntos de atención (Fase 2).

### El botón «Solicitar» de un servicio lleva a los puntos de atención

En el modal de un servicio, el botón de la plantilla no hacía **nada**. La Fase 3
lo convirtió en un enlace a `/puntos-atencion`, que es lo honesto mientras no
haya un número de WhatsApp ni un agendamiento del negocio. **La Fase 6 ya trajo
el contacto general** (`site_settings.whatsapp`, hoy vacío — ver «Datos que
faltan»): en cuanto tenga un número real, este botón debería abrir
`https://wa.me/<whatsapp>` con el nombre del servicio en el mensaje, en vez de
enlazar a `/puntos-atencion`.

### Los enlaces institucionales del footer son anclas rotas

`web/src/components/footer/footer-data.json` (`quickLinks` y `support`) sigue
enlazando a `#inicio`, `#garantia`, `#manual`, `#repuestos`,
`#servicio-tecnico`, `#faq`, etc. — anclas de una maqueta de una sola página
que no llevan a ningún lado. Detectado al inventariar la Fase 6 (configuración
del sitio); no es parte de esa fase porque son enlaces de navegación, no datos
de configuración. Arreglarlos significa decidir a dónde debería ir cada uno
(¿una página `/garantia`? ¿una sección de `/servicios`? ¿desaparecer del
todo?), que es una decisión de contenido, no solo de código.

### `web/manifest.json` no lee de `site_settings`

El nombre y la descripción del sitio se administran desde `/configuracion`
(Fase 6) para el `<title>`, el `<meta description>` y el Open Graph, pero
`web/public/manifest.json` (el manifiesto de la PWA: `name`, `short_name`,
`description`) sigue siendo un JSON estático servido sin build step de
Next — no puede leer de la base de datos en tiempo real sin convertirlo en una
ruta dinámica (`app/manifest.ts`, que Next sí soporta con un `export default
async function` y un tipo `MetadataRoute.Manifest`). Se dejó fuera de la Fase 6
a propósito para no arriesgar la integración con `next-pwa`
(`next.config.ts`) sin poder probarla a fondo. Si el nombre del sitio cambia
alguna vez, hay que recordar tocar este archivo a mano.

### `motorcycle` no tiene campo de placa

El catálogo legacy la lleva metida dentro del texto libre de `description`.
Mientras no exista la columna, la lista identifica la moto por miniatura,
nombre, marca, año y kilometraje, y **el buscador no puede buscar por placa** —
que es probablemente como la busca quien atiende el mostrador.

### El filtrado de motos ocurre en el cliente

`use-motorcycles.ts` trae el catálogo completo en páginas de 100 y filtra en
memoria, porque la query del backend no busca ni ordena y buscar es lo que más
se hace. Con ~120 motos es instantáneo. **Si el catálogo llega a unos pocos
miles, hay que mover búsqueda, orden y paginación a la query.**

---

## Datos que faltan

Los puntos de atención se cargaron desde `motoshotwheels.com` en la Fase 2, pero
el sitio legacy no publica todo:

| Punto | Qué falta |
|---|---|
| Sede la 80 | **casi todo**: teléfono, correo, dirección de la calle, horarios y enlace de Maps. Solo se pudo confirmar que existe y que está en Medellín |
| Sede San Diego | correo, enlace de Maps, barrio |
| Sede Belén La Palma | correo, enlace de Maps |
| Yamaha Moto Hertz (El Retiro) | correo, horarios, barrio |
| Mega Scooter Shop Colombia (Bogotá) | correo, horarios, barrio |

Y tres cosas que solo el dueño del negocio puede confirmar:

- Los horarios cargados en las dos sedes de Medellín salen de
  `repuestos.motoshotwheels.com/contacto`, que los publica **sin decir a qué
  sede aplican**.
- El nombre de la sede de El Retiro: el legacy la llama "Sede Oriente
  Antioqueño", "Motos Hertz" y "YAMAHA El Retiro" en distintos sitios.
- Si **Mega Scooter (Bogotá)** debe aparecer en el sitio público: el legacy lo
  lista como distribuidor y también lo ofrece en su selector de WhatsApp.

### `site_settings` tiene dos campos sembrados a propósito sin dato real (Fase 6)

La migración `011` puebla la fila única con los valores que ya estaban en el
código, pero dos de ellos son placeholder, no el dato real:

- **`phone`** quedó en `+57 300 000 0000`. El valor que había en el código
  (`+52 55 1234 5678`, en `footer-data.json`) tenía el prefijo de México en un
  sitio colombiano — dato de prueba sin limpiar de la plantilla original, no
  algo que valiera la pena preservar. Hay que corregirlo desde
  `/configuracion` → Contacto con el teléfono real.
- **`whatsapp`** quedó vacío (`null`). Es un campo nuevo de esta fase: no
  existía configuración de WhatsApp a nivel de sitio antes (solo por punto de
  atención, Fase 2). Mientras esté vacío, el pie de página no muestra el
  enlace de WhatsApp — no es un error, es el comportamiento esperado de un
  campo opcional sin valor. Cargarlo también resuelve el punto de arriba
  («El botón «Solicitar» de un servicio…»).

Los cuatro enlaces sociales (`socialFacebook/Instagram/Twitter/Youtube`)
también quedaron en `null` — antes eran anclas rotas (`#facebook`, …), nunca
enlaces reales, así que no había nada que preservar. Cargarlos desde
`/configuracion` → Redes sociales hace aparecer el ícono correspondiente en el
pie de página (hoy no se muestra ninguno).

---

## Entorno y despliegue

### La IP de la red local está quemada en dos sitios

`MEDIA_PUBLIC_BASE_URL` (en `backend/docker-compose.override.yml`, local y no
versionado) y `web/.env.local` apuntan a `192.168.40.24`, para poder probar
desde el teléfono. **Si esa IP cambia, las URLs de imágenes ya guardadas quedan
rotas** y la página pública deja de cargar. Los valores versionados por defecto
sí usan `localhost`.

Al desplegar hay que fijar el dominio real, y acordarse de que las URLs ya
guardadas en la base llevan dentro el valor viejo — por eso `media` guarda
también la `key`, que permite rearmarlas.

### `ADMIN_PASSWORD_HASH` lleva `$` sin escapar en `.env`

`docker compose` interpola `$2b`, `$10` y el resto del hash bcrypt como si
fueran variables, y avisa en cada comando. Hoy no rompe nada porque el valor
bueno viene de `docker-compose.yml`, que sí los escapa con `$$`. Es un pie de
banco esperando a que alguien confíe en el `.env`.

### No hay un sembrador de datos de verdad

Las fases 0 a 2 se probaron con scripts de Python de usar y tirar en el
scratchpad. Un `backend/scripts/seed.ts` con datos representativos de cada
dominio serviría para las fases siguientes, para pruebas y para levantar un
entorno nuevo.

### El paquete se llama `yamaha-oriente-cms-admin`

Herencia de la plantilla. La interfaz dice "Motos Hot Wheels" porque el catálogo
es multimarca. Renombrar el paquete (y el del backend) es un cambio mecánico
pero toca `package.json`, los filtros de `pnpm --filter`, los scripts y la
documentación.

---

## Calidad

### La cobertura de tests no llega al mínimo configurado

`backend/jest.config` exige 70 % y no se alcanza globalmente. Hay tests de
`motorcycle.service`, `service-point.service`, `media.service` y `maps-url`,
pero el resto del backend no está cubierto.

### `BannerWrapper.tsx` y `OptimizedHero.tsx` son código muerto

`web/src/components/banner/`, además de `Banner.tsx` (el que de verdad se usa),
tiene `BannerWrapper.tsx` y `OptimizedHero.tsx`: los dos importan `next/image`
y ninguno de los dos se referencia desde ningún lado — ni en el scaffold
original (`2ae3829`) ni después. No es algo que rompió la Fase 5, ya estaban
así; se detectaron al revisar quién usaba `next/image` en `web` (ver la nota
de banners más abajo). Se pueden borrar sin que nada quede huérfano.

### Un campo de imagen opcional no se puede limpiar desde la ficha

`image`/`imageMobile` en banners, igual que `service.image` y `news.image`,
solo se **reemplazan**: si alguien quita la foto en `ImagePicker` (queda en
`''`) y guarda, el campo llega como `undefined` a la mutación de edición y
`undefined` "no toca la columna" (así está documentado en las tres capas), así
que la imagen vieja se queda. Para quitarla de verdad hoy hay que pegar una
URL distinta o vaciar el campo directo en la base. Ninguna de las fichas del
panel deja limpiar un campo de imagen a propósito; si se resuelve, hay que
decidirlo una vez y aplicarlo a los tres dominios.

### HEIC nunca se probó con un archivo real

El MIME está aceptado y sharp trae libheif, pero en la Fase 1 no había un HEIC
de verdad. Si un iPhone sube en ese formato y falla, el mensaje que verá el
usuario es el genérico de "formato que el servidor no entiende".

### `next/image` con una imagen del panel revienta la página entera, no solo la foto

Se descubrió al construir la Fase 5: `Cards.tsx` y `NewsSection.tsx` (la home)
usaban `next/image` para pintar `service.image`/`news.image`, y en cuanto una
de esas URLs venía del servidor de medios local (`192.168.40.24:8080/...`, un
host que no está en `images.remotePatterns` de `next.config.ts`) la página
completa caía con **"Application error: a client-side exception has
occurred"** — `next/image` lanza una excepción síncrona al renderizar, no
falla en silencio como una imagen rota. Se corrigió usando `<img>` de verdad
en los tres componentes de la home (`Banner.tsx`, `Cards.tsx`,
`NewsSection.tsx`), que es el mismo criterio que ya usaban `/servicios` y
`/noticias` para las mismas URLs. **Cualquier componente nuevo que pinte una
imagen que venga de un dominio (`service.image`, `news.image`,
`banner.image`/`imageMobile`, o cualquier URL de texto libre pegada en el
panel) tiene que usar `<img>`, nunca `next/image`** — a menos que alguien
agregue el/los host(s) de medios de cada entorno a `remotePatterns`, lo cual
además habría que mantener por cada dominio nuevo donde corra el driver
`local` de almacenamiento.

