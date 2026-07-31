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
haya un número de WhatsApp ni un agendamiento del negocio. Cuando la Fase 6
(configuración del sitio) traiga el contacto general, ese botón debería abrir el
chat o el agendamiento con el servicio ya nombrado.

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

### HEIC nunca se probó con un archivo real

El MIME está aceptado y sharp trae libheif, pero en la Fase 1 no había un HEIC
de verdad. Si un iPhone sube en ese formato y falla, el mensaje que verá el
usuario es el genérico de "formato que el servidor no entiende".

