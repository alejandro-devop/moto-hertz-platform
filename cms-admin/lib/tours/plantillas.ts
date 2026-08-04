import type { DefinicionTour, PasoTour } from './types';

/**
 * Las dos plantillas de recorrido — `lista` y `ficha` — de las que salen casi
 * todas las secciones del panel.
 *
 * **Por qué existen.** Los ocho módulos del panel son el mismo módulo:
 * `PageHeader` + `BarraFiltros` + `ListaResponsive` + `RowActions` +
 * `Paginacion` + `FormSheet`. Lo que cambia entre motos, servicios y noticias
 * no es la estructura, son los sustantivos. Escribir ocho recorridos a mano
 * sería escribir el mismo recorrido ocho veces y que se desincronicen a la
 * tercera.
 *
 * **Las anclas son genéricas, no llevan el nombre de la sección.** `lista.tabla`,
 * no `motos.tabla`. Solo hay una lista en pantalla a la vez y una sola ficha
 * abierta a la vez, así que no hay ambigüedad — y a cambio, los componentes
 * compartidos llevan su `data-tour` **una sola vez** y toda sección nueva los
 * hereda sin tocar nada. Una sección que quiera señalar algo suyo (los papeles
 * de una moto, los horarios de un punto) usa su propio espacio de nombres y lo
 * pasa en `extra`.
 */

interface TextosPaso {
  titulo: string;
  texto: string;
}

interface OpcionesLista {
  clave: string;
  version: number;
  /** Como se lista en «Ayuda y recorridos»: «Motos», «Puntos de atención». */
  nombre: string;
  /** En minúscula y en singular, para las frases: «una moto», «un servicio». */
  singular: string;
  /** En minúscula y en plural: «las motos», «los servicios». */
  plural: string;
  /** El artículo que le toca al singular. Cambia «una moto» por «un servicio». */
  articulo?: 'una' | 'un';
  /** Qué dice el botón de crear: «Publicar moto», «Nuevo servicio». */
  crear: string;
  /** Sustituye el texto de un paso concreto cuando el genérico no encaja. */
  textos?: Partial<Record<PasoListaId, Partial<TextosPaso>>>;
  /** Pasos propios de la sección, al final. Sus anclas van en el espacio de nombres de la sección. */
  extra?: PasoTour[];
}

export type PasoListaId = 'crear' | 'filtros' | 'papelera' | 'tabla' | 'acciones';

/**
 * El recorrido de una lista. Cinco pasos, en el orden en que se usa la
 * pantalla: primero cómo se crea algo, después cómo se encuentra, y al final
 * qué se le puede hacer.
 *
 * **Sin paso de paginación**, aunque el plan de la fase lo listaba. Son cinco
 * pasos y el tope son seis: gastar el que queda en explicar unos botones de
 * «anterior / siguiente» que no ha confundido a nadie, en vez de dejar sitio
 * para lo propio de cada sección, sale caro. Una sección que lo necesite lo
 * agrega en `extra`.
 *
 * El paso de la papelera está aquí y no en cada sección a propósito: es la
 * pieza menos evidente del panel entero —eliminar no borra, y lo borrado se ve
 * cambiando un filtro que no parece un filtro de papelera— y hoy no se la
 * explica nadie.
 */
export function tourDeLista(op: OpcionesLista): DefinicionTour {
  const { singular, plural, articulo = 'una' } = op;
  const texto = (id: PasoListaId, porDefecto: TextosPaso): TextosPaso => ({
    titulo: op.textos?.[id]?.titulo ?? porDefecto.titulo,
    texto: op.textos?.[id]?.texto ?? porDefecto.texto,
  });

  const pasos: PasoTour[] = [
    {
      ancla: 'lista.crear',
      lado: 'bottom',
      alineacion: 'end',
      ...texto('crear', {
        titulo: `Crear ${articulo} ${singular}`,
        texto: `«${op.crear}» abre la ficha en blanco. Se guarda desde ahí y aparece en esta lista.`,
      }),
    },
    {
      ancla: 'lista.filtros',
      lado: 'bottom',
      alineacion: 'start',
      ...texto('filtros', {
        titulo: 'Buscar y filtrar',
        texto: `El buscador y los filtros se quedan en la dirección del navegador: puedes compartir el enlace de ${plural} filtradas, y el botón de atrás funciona.`,
      }),
    },
    {
      ancla: 'lista.filtros',
      lado: 'bottom',
      alineacion: 'start',
      ...texto('papelera', {
        titulo: 'La papelera vive aquí',
        texto: `Eliminar nunca borra de una vez: manda a la papelera. Para verla, cambia el filtro de estado a «En papelera» — desde ahí se restaura o se elimina de verdad.`,
      }),
    },
    {
      ancla: 'lista.tabla',
      lado: 'top',
      alineacion: 'center',
      ...texto('tabla', {
        titulo: `${op.nombre} en el sitio`,
        texto: 'En el computador es una tabla; en el teléfono, la misma información como tarjetas. Tocar una fila abre su ficha.',
      }),
    },
    {
      ancla: 'lista.acciones',
      lado: 'left',
      alineacion: 'start',
      ...texto('acciones', {
        titulo: 'Todo lo demás está aquí',
        texto: `Este menú tiene lo que se le puede hacer a ${articulo} ${singular} sin abrir la ficha. Lo que elimina va de último y siempre pregunta.`,
      }),
    },
    ...(op.extra ?? []),
  ];

  return {
    clave: op.clave,
    nombre: op.nombre,
    descripcion: `Cómo se crean, se buscan y se administran ${plural}.`,
    version: op.version,
    pasos,
  };
}

interface OpcionesFicha {
  clave: string;
  version: number;
  nombre: string;
  singular: string;
  articulo?: 'una' | 'un';
  textos?: Partial<Record<PasoFichaId, Partial<TextosPaso>>>;
  extra?: PasoTour[];
}

export type PasoFichaId = 'secciones' | 'obligatorio' | 'guardar';

/**
 * El recorrido de una ficha. **Se dispara al abrir una ficha por primera vez**,
 * no desde el recorrido de la lista: la ficha es una hoja lateral, y encadenarla
 * al de la lista obligaría al recorrido a abrirla por el usuario — a manejarle
 * la interfaz, que es justo lo que este sistema no hace.
 *
 * De ahí también el `retraso`: la hoja entra deslizándose, y medir las anclas a
 * mitad del deslizamiento deja el globo apuntando a donde estaban, no a donde
 * quedaron.
 *
 * **No hay paso de imágenes**, aunque el plan de la fase lo listaba: el
 * selector de fotos vive detrás de una pestaña que no es la que se abre por
 * defecto, así que ese paso se saltaría siempre. Las imágenes tienen su propio
 * recorrido en la Fase 3, disparado la primera vez que se abre el selector,
 * que es donde de verdad hace falta.
 */
export function tourDeFicha(op: OpcionesFicha): DefinicionTour {
  const { singular, articulo = 'una' } = op;
  const texto = (id: PasoFichaId, porDefecto: TextosPaso): TextosPaso => ({
    titulo: op.textos?.[id]?.titulo ?? porDefecto.titulo,
    texto: op.textos?.[id]?.texto ?? porDefecto.texto,
  });

  const pasos: PasoTour[] = [
    {
      ancla: 'ficha.secciones',
      lado: 'bottom',
      alineacion: 'start',
      ...texto('secciones', {
        titulo: 'La ficha va por secciones',
        texto: `No es un formulario largo: cada pestaña agrupa los campos como se piensan. Puedes moverte entre ellas sin perder lo escrito.`,
      }),
    },
    {
      ancla: 'ficha.obligatorio',
      lado: 'right',
      alineacion: 'start',
      ...texto('obligatorio', {
        titulo: 'Lo marcado con * es obligatorio',
        texto: 'Si algo falta al guardar, la pestaña donde está se marca con el número de campos por corregir y la ficha te lleva al primero.',
      }),
    },
    {
      ancla: 'ficha.guardar',
      lado: 'top',
      alineacion: 'end',
      ...texto('guardar', {
        titulo: 'Guardar, y qué pasa si no',
        texto: `A la izquierda dice si hay algo sin guardar. Cerrar con cambios pendientes siempre pregunta antes de perderlos.`,
      }),
    },
    ...(op.extra ?? []),
  ];

  return {
    clave: op.clave,
    nombre: `Ficha de ${articulo} ${singular}`,
    descripcion: `Cómo se edita y se guarda ${articulo} ${singular}.`,
    version: op.version,
    pasos,
    /* Lo que tarda la hoja lateral en terminar de entrar. */
    retraso: 320,
  };
}
