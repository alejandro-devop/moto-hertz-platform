import { navLinks, type NavLink } from '@/app/(admin)/nav-links';
import { anclaDeGrupo } from './grupos';
import { tourDeFicha, tourDeLista } from './plantillas';
import type { DefinicionTour, PasoTour } from './types';

/**
 * El listado de secciones de un grupo, para el recorrido de bienvenida. Sale
 * de `navLinks`, que es donde ya vive cada `descripcion`: una sección nueva
 * queda explicada por el solo hecho de declararse ahí, sin un texto paralelo
 * que se olvide de actualizar.
 *
 * `driver.js` mete la descripción con `innerHTML`, así que se puede maquetar.
 * Lo que va aquí lo escribimos nosotros —nunca datos de nadie—, que es la
 * única razón por la que eso es seguro.
 */
function secciones(grupo: NavLink['group']): string {
  const items = navLinks
    .filter((enlace) => enlace.group === grupo)
    .map((enlace) => `<li><b>${enlace.label}</b> — ${enlace.descripcion}</li>`)
    .join('');
  return `<ul class="tour-secciones">${items}</ul>`;
}

/** Un paso por grupo de la barra lateral: qué es cada opción del menú. */
function pasoDeGrupo(grupo: NavLink['group'], titulo: string): PasoTour {
  return {
    ancla: anclaDeGrupo(grupo),
    solo: 'escritorio',
    titulo,
    texto: secciones(grupo),
    lado: 'right',
    alineacion: 'start',
  };
}

/**
 * El catálogo de recorridos guiados del panel. Todo lo que existe está aquí:
 * es la lista que se muestra en «Ayuda y recorridos» (Configuración) y la
 * única fuente de claves y versiones.
 *
 * Para agregar un recorrido de sección: se llama a `tourDeLista` /
 * `tourDeFicha` con los sustantivos de la sección, se cuelgan los `data-tour`
 * propios si los hay, y la página llama a `useTour()`. Los pasos comunes
 * (crear, filtrar, papelera, tabla, acciones) ya los traen las plantillas, y
 * sus anclas ya están en los componentes compartidos.
 */
const DEFINICIONES = {
  /**
   * **Versión 3.** La Fase 0 lo dejó en 3 pasos, la Fase 1 lo subió a 4 con el
   * botón de ayuda, y esta versión hace lo que faltaba: **decir qué es cada
   * opción del menú**, no solo que el menú existe. Un paso por grupo de la
   * barra lateral, con las secciones de ese grupo y media línea cada una.
   *
   * Para que quepa sin pasarse del tope de seis, «ver el sitio» y «cambiar el
   * tema» pasaron a ser un solo paso: son dos controles vecinos y triviales,
   * y gastaban dos pasos de un presupuesto que hacía falta para el menú.
   */
  'panel.bienvenida': {
    clave: 'panel.bienvenida',
    nombre: 'Bienvenida al panel',
    descripcion: 'Qué se administra en cada sección, y dónde está cada cosa.',
    version: 3,
    pasos: [
      pasoDeGrupo('Catálogo', 'Catálogo — lo que ofreces'),
      pasoDeGrupo('Contenido', 'Contenido — lo que publicas'),
      pasoDeGrupo('Sistema', 'Sistema — cómo se comporta el sitio'),
      {
        ancla: 'panel.tabbar',
        solo: 'movil',
        titulo: 'Todo el panel está aquí',
        texto: `Las secciones que más se visitan, al alcance del pulgar; el resto —y el cambio de tema— está en «Más».${secciones('Catálogo')}`,
        lado: 'top',
        alineacion: 'center',
      },
      {
        ancla: 'panel.tabbar',
        solo: 'movil',
        titulo: 'Y lo que publicas',
        texto: `${secciones('Contenido')}${secciones('Sistema')}`,
        lado: 'top',
        alineacion: 'center',
      },
      {
        ancla: 'panel.ayuda',
        titulo: 'Cada sección se explica sola',
        texto:
          'La primera vez que entras a una sección te muestra un recorrido como este. Con este botón lo vuelves a ver cuando quieras.',
        lado: 'bottom',
        alineacion: 'start',
      },
      {
        ancla: 'panel.barra',
        solo: 'escritorio',
        titulo: 'Ver cómo quedó, y con qué luz',
        texto:
          'El primer botón abre el sitio público en otra pestaña: lo que guardas aquí se ve allá. Al lado se cambia entre claro y oscuro.',
        lado: 'bottom',
        alineacion: 'end',
      },
    ],
  },

  /**
   * Motos es la sección de referencia del panel, así que es la primera que
   * estrena las plantillas. Lo único que aporta más allá de la plantilla es el
   * paso de los papeles: SOAT y tecnomecánica son los únicos datos del panel
   * que caducan solos, y esa franja de aviso aparece sin que nadie la pida.
   */
  /* Versión 2: la plantilla ganó el paso de cierre que recuerda dónde está el
     «?», así que el recorrido vuelve a salir para quien ya vio la versión 1. */
  'motos.lista': tourDeLista({
    clave: 'motos.lista',
    version: 2,
    nombre: 'Motos',
    singular: 'moto',
    plural: 'las motos',
    crear: 'Publicar moto',
    textos: {
      acciones: {
        texto:
          'Aquí está lo que se le puede hacer a una moto sin abrir la ficha — entre otras, marcarla como vendida, que la saca del sitio pero conserva el registro. Eliminar va de último y siempre pregunta.',
      },
    },
    extra: [
      {
        ancla: 'motos.papeles',
        titulo: 'Los papeles avisan solos',
        texto:
          'SOAT y tecnomecánica son lo único que caduca sin que nadie lo toque. Cuando a alguna moto usada le queden 30 días o menos, aparece esta franja y lleva directo a las afectadas.',
        lado: 'bottom',
        alineacion: 'start',
      },
    ],
  }),

  'motos.ficha': tourDeFicha({
    clave: 'motos.ficha',
    version: 1,
    nombre: 'Motos',
    singular: 'moto',
    textos: {
      secciones: {
        texto:
          'Una moto tiene 41 campos: en un formulario de corrido no se encuentra nada. Cada pestaña agrupa los que se piensan juntos, y moverte entre ellas no pierde lo escrito.',
      },
    },
  }),

  /**
   * Fase 2. Puntos de atención y Servicios son calcadas de Motos, así que las
   * plantillas entraron sin tocarlas: lo único que se escribió fue el nombre de
   * las cosas y los pasos propios de cada una.
   *
   * Y son las primeras fichas con pasos que declaran `seccion`: lo que de
   * verdad hay que explicar de un punto o de un servicio vive detrás de una
   * pestaña, y sin eso se saltaría siempre. Ver `control-ficha.ts`.
   */
  'puntos.lista': tourDeLista({
    clave: 'puntos.lista',
    version: 1,
    nombre: 'Puntos de atención',
    singular: 'punto',
    plural: 'los puntos de atención',
    articulo: 'un',
    crear: 'Agregar punto',
    textos: {
      tabla: {
        texto:
          'Cada fila resume el punto como lo ve quien lo busca: dirección, tipo y si tiene horario cargado. Tocarla abre su ficha.',
      },
    },
    extra: [
      {
        ancla: 'puntos.sin-horario',
        titulo: 'Un punto sin horario es un reclamo',
        texto:
          'Si a algún punto le falta el horario, el sitio no puede decir cuándo abre — y la gente llega y está cerrado. Esta franja aparece sola mientras quede alguno así.',
        lado: 'bottom',
        alineacion: 'start',
      },
    ],
  }),

  'puntos.ficha': tourDeFicha({
    clave: 'puntos.ficha',
    version: 1,
    nombre: 'Puntos de atención',
    singular: 'punto',
    articulo: 'un',
    extra: [
      {
        ancla: 'puntos.horarios',
        seccion: 'horarios',
        titulo: 'Los horarios, día por día',
        texto:
          'Un día apagado está <b>cerrado</b>: no hay que escribir nada más. Y si abre lo mismo casi toda la semana, llena un día y usa «Copiar a los demás».',
        lado: 'top',
        alineacion: 'center',
      },
      {
        ancla: 'puntos.mapa',
        seccion: 'ubicacion',
        titulo: 'La ubicación se pega, no se escribe',
        texto:
          'Busca el punto en Google Maps, dale a Compartir → Copiar vínculo y pégalo aquí. <b>Ojo con los enlaces cortos</b> (<code>maps.app.goo.gl</code>): no traen las coordenadas, y el sitio se queda sin mapa. El campo te avisa apenas lo pegas.',
        lado: 'top',
        alineacion: 'start',
      },
    ],
  }),

  'servicios.lista': tourDeLista({
    clave: 'servicios.lista',
    version: 1,
    nombre: 'Servicios',
    singular: 'servicio',
    plural: 'los servicios',
    articulo: 'un',
    crear: 'Agregar servicio',
    textos: {
      crear: {
        texto:
          'Esta sección arranca vacía a propósito: los servicios que ofreces los escribes tú, no vienen de plantilla. «Agregar servicio» abre la ficha en blanco.',
      },
    },
  }),

  'servicios.ficha': tourDeFicha({
    clave: 'servicios.ficha',
    version: 1,
    nombre: 'Servicios',
    singular: 'servicio',
    articulo: 'un',
    extra: [
      {
        ancla: 'servicios.icono',
        seccion: 'identidad',
        titulo: 'El icono se elige, no se escribe',
        texto:
          'Se abre una rejilla con vista previa y nombres de taller («Frenos», no «Disco»). Es lo que identifica al servicio en la lista y en el sitio.',
        lado: 'top',
        alineacion: 'start',
      },
      {
        ancla: 'servicios.precio',
        seccion: 'precio',
        titulo: 'Tres formas de cobrar',
        texto:
          '<b>Desde</b> un monto, <b>precio fijo</b>, o <b>a convenir</b>. Con «a convenir» el campo del monto se apaga en vez de esconderse —para que no parezca que se perdió— y lo que quede escrito no se guarda.',
        lado: 'bottom',
        alineacion: 'start',
      },
    ],
  }),

  /**
   * Fase 3. Noticias, Banners y Medios son las primeras secciones con
   * interfaz propia de verdad —un editor enriquecido, un orden manual, una
   * biblioteca sin ficha— así que a diferencia de la Fase 2, aquí sí hay que
   * mirar cada una con cuidado y no solo colgar el nombre.
   */
  'noticias.lista': tourDeLista({
    clave: 'noticias.lista',
    version: 1,
    nombre: 'Noticias',
    singular: 'noticia',
    plural: 'las noticias',
    articulo: 'una',
    crear: 'Agregar noticia',
  }),

  'noticias.ficha': tourDeFicha({
    clave: 'noticias.ficha',
    version: 1,
    nombre: 'Noticias',
    singular: 'noticia',
    articulo: 'una',
    extra: [
      {
        ancla: 'noticias.editor',
        seccion: 'contenido',
        titulo: 'El contenido es enriquecido, no texto plano',
        texto:
          'Negrita, encabezados, listas, cita y enlaces desde esta barra. Se guarda tal como se ve — no hay una vista previa aparte que revisar.',
        lado: 'top',
        alineacion: 'center',
      },
      {
        ancla: 'noticias.publicacion',
        seccion: 'publicacion',
        titulo: 'Sin fecha, no existe para el sitio',
        texto:
          'Sin fecha de publicación la noticia queda en <b>borrador</b>: no se ve en ningún lado. Con una fecha futura queda <b>programada</b> y sale sola ese día — pero el cambio solo se nota cuando alguien recargue el sitio.',
        lado: 'top',
        alineacion: 'start',
      },
    ],
  }),

  'banners.lista': tourDeLista({
    clave: 'banners.lista',
    version: 1,
    nombre: 'Banners',
    singular: 'banner',
    plural: 'los banners',
    articulo: 'un',
    crear: 'Agregar banner',
    extra: [
      {
        ancla: 'banners.orden',
        titulo: 'Dos carruseles, cada uno con su orden',
        texto:
          'El selector «Dónde aparece» elige cuál miras; estas flechas mueven un banner dentro de <b>ese</b> carrusel nada más, y se guardan al toque. Se apagan mientras haya una búsqueda escrita, para no mover algo que no está en pantalla.',
        lado: 'right',
        alineacion: 'start',
      },
    ],
  }),

  'banners.ficha': tourDeFicha({
    clave: 'banners.ficha',
    version: 1,
    nombre: 'Banners',
    singular: 'banner',
    articulo: 'un',
    extra: [
      {
        ancla: 'banners.vigencia',
        seccion: 'vigencia',
        titulo: 'Activo, y dentro de fecha: hacen falta las dos',
        texto:
          'Con <b>Activo</b> apagado no sale aunque esté dentro de sus fechas, y con las fechas vencidas tampoco sale aunque esté activo. Las dos condiciones se cumplen a la vez, o el banner no se ve.',
        lado: 'top',
        alineacion: 'start',
      },
    ],
  }),

  /**
   * Medios no tiene ficha: es la única sección que es solo lista. «Agregar»
   * abre un diálogo de subida en vez de una ficha, y el menú de fila hace
   * cosas que ningún otro módulo hace (copiar la URL) o hace distinto
   * (eliminar manda a la papelera, pero la imagen sigue sirviendo su URL
   * mientras esté ahí) — por eso lleva más texto propio que ninguna otra
   * sección de la Fase 3, y ni una ancla nueva: las seis piezas de la
   * plantilla ya estaban donde hacían falta.
   */
  'medios.lista': tourDeLista({
    clave: 'medios.lista',
    version: 1,
    nombre: 'Medios',
    singular: 'imagen',
    plural: 'las imágenes',
    articulo: 'una',
    crear: 'Subir imágenes',
    textos: {
      crear: {
        titulo: 'Subir imágenes',
        texto:
          'Se guardan en WebP y con el lado mayor reducido a 1600 px. Esta es la biblioteca completa del panel: la misma foto se reusa desde cualquier ficha con «Elegir de la biblioteca», sin volver a subirla.',
      },
      papelera: {
        texto:
          'Eliminar manda a la papelera, no borra de una vez. Mientras esté ahí, la imagen <b>sigue respondiendo su URL</b> en cualquier ficha que la use — recién al eliminar definitivamente se borra el archivo del servidor.',
      },
      tabla: {
        titulo: 'La biblioteca, no el sitio',
        texto:
          'En el computador es una tabla; en el teléfono, tarjetas. No hay ficha que abrir aquí: tocar la imagen la abre en una pestaña nueva.',
      },
      acciones: {
        texto:
          'Copiar la URL es lo que más se usa día a día. Eliminar es lo único que va a la papelera en vez de borrar directo, para poder arrepentirse.',
      },
    },
  }),

  /**
   * El único recorrido que no vive en una pantalla, sino en un componente
   * compartido: `SelectorBiblioteca`, dentro de `image-picker.tsx`. Se pide
   * al abrir ese diálogo —«Elegir de la biblioteca»—, no al abrir la ficha
   * que lo contiene, y por eso nunca compite con el tour de esa ficha por la
   * cola: para cuando el usuario llega a abrirlo, el de la ficha ya terminó
   * o ya se vio. Es la funcionalidad que más se parece a WordPress sin serlo.
   */
  'panel.imagenes': {
    clave: 'panel.imagenes',
    nombre: 'Elegir de la biblioteca',
    descripcion: 'Cómo reusar una foto ya subida en vez de volver a subirla.',
    version: 1,
    pasos: [
      {
        ancla: 'imagenes.buscar',
        titulo: 'Busca por nombre',
        texto: 'Si la biblioteca ya tiene muchas fotos, escribe parte del nombre del archivo para encontrarla más rápido.',
        lado: 'bottom',
        alineacion: 'start',
      },
      {
        ancla: 'imagenes.grid',
        titulo: 'Las fotos que ya subiste, a un clic',
        texto:
          'Toca la que quieras usar aquí: si el campo acepta una sola, elegirla cierra el diálogo; si acepta varias, marca las que quieras y confirma abajo. Es la misma biblioteca que ves en <b>Medios</b>.',
        lado: 'top',
        alineacion: 'center',
      },
    ],
  },
} satisfies Record<string, DefinicionTour>;

export type ClaveTour = keyof typeof DEFINICIONES;

/**
 * El `satisfies` de arriba comprueba cada definición y deja inferir las claves
 * exactas; esta línea ensancha los valores a `DefinicionTour`, porque si no el
 * tipo de `TOURS[clave]` sería la unión de los literales y un campo opcional
 * que solo usa una definición (`retraso`) «no existiría» en las demás.
 */
export const TOURS: Record<ClaveTour, DefinicionTour> = DEFINICIONES;

/** El orden en que se listan en Configuración: el mismo en que se declaran. */
export const TOURS_ORDENADOS: DefinicionTour[] = Object.values(TOURS);

export function esClaveTour(clave: string): clave is ClaveTour {
  return clave in DEFINICIONES;
}
