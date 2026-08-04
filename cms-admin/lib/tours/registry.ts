import { tourDeFicha, tourDeLista } from './plantillas';
import type { DefinicionTour } from './types';

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
   * **Versión 2.** La Fase 0 lo dejó en 3 pasos —los del armazón que existen
   * en todas las pantallas— y la Fase 1 le agrega los grupos de la navegación
   * y dónde está la ayuda de cada sección. Subir la versión hace que vuelva a
   * salir para quien ya vio el corto, sin borrarle el historial: es
   * exactamente el caso para el que existe `version`, y el primero de verdad.
   */
  'panel.bienvenida': {
    clave: 'panel.bienvenida',
    nombre: 'Bienvenida al panel',
    descripcion: 'Dónde está cada cosa en el armazón del panel.',
    version: 2,
    pasos: [
      {
        ancla: 'panel.rail',
        solo: 'escritorio',
        titulo: 'Todo el panel está aquí',
        texto:
          'Las secciones van en tres grupos: Catálogo es lo que se vende, Contenido es lo que se lee, y Sistema es cómo se comporta el sitio. Se puede colapsar a solo iconos cuando una tabla necesita el ancho.',
        lado: 'right',
        alineacion: 'start',
      },
      {
        ancla: 'panel.tabbar',
        solo: 'movil',
        titulo: 'Todo el panel está aquí',
        texto:
          'Las secciones que más se visitan, al alcance del pulgar. El resto —y el cambio de tema— está en «Más».',
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
        ancla: 'panel.sitio',
        solo: 'escritorio',
        titulo: 'Ver cómo quedó',
        texto: 'Abre el sitio público en otra pestaña. Lo que guardas aquí se ve allá.',
        lado: 'bottom',
        alineacion: 'end',
      },
      {
        ancla: 'panel.tema',
        solo: 'escritorio',
        titulo: 'Claro u oscuro',
        texto: 'El panel se adapta a lo que uses en tu computador, y aquí lo cambias a mano.',
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
  'motos.lista': tourDeLista({
    clave: 'motos.lista',
    version: 1,
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
