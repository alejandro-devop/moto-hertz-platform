import type { DefinicionTour } from './types';

/**
 * El catálogo de recorridos guiados del panel. Todo lo que existe está aquí:
 * es la lista que se muestra en «Ayuda y recorridos» (Configuración) y la
 * única fuente de claves y versiones.
 *
 * Para agregar un recorrido: se define aquí, se cuelgan los `data-tour` con
 * `tourAnchor()` en los elementos que señala, y la página llama a `useTour()`.
 * Nada más — el provider se encarga de si toca mostrarlo y de marcarlo visto.
 */
export const TOURS = {
  /**
   * Fase 0 del plan de tours. Nace corto a propósito: son los tres elementos
   * del armazón que están en todas las pantallas. La Fase 1 lo amplía con los
   * grupos de la navegación y dónde está la ayuda, y **sube la versión a 2** —
   * que es justo para lo que sirve `version`: el recorrido vuelve a salir para
   * quien ya vio el corto, sin borrarle el historial.
   */
  'panel.bienvenida': {
    clave: 'panel.bienvenida',
    nombre: 'Bienvenida al panel',
    descripcion: 'Dónde está cada cosa en el armazón del panel.',
    version: 1,
    pasos: [
      {
        ancla: 'panel.rail',
        solo: 'escritorio',
        titulo: 'Todo el panel está aquí',
        texto:
          'Cada sección del sitio se administra desde esta barra. Se puede colapsar a solo iconos cuando una tabla necesita el ancho.',
        lado: 'right',
        alineacion: 'start',
      },
      {
        ancla: 'panel.tabbar',
        solo: 'movil',
        titulo: 'Todo el panel está aquí',
        texto:
          'Las secciones que más se visitan, al alcance del pulgar. El resto está en «Más».',
        lado: 'top',
        alineacion: 'center',
      },
      {
        ancla: 'panel.sitio',
        solo: 'escritorio',
        titulo: 'Ver cómo quedó',
        texto:
          'Abre el sitio público en otra pestaña. Lo que guardas aquí se ve allá.',
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
} satisfies Record<string, DefinicionTour>;

export type ClaveTour = keyof typeof TOURS;

/** El orden en que se listan en Configuración: el mismo en que se declaran. */
export const TOURS_ORDENADOS: DefinicionTour[] = Object.values(TOURS);

export function esClaveTour(clave: string): clave is ClaveTour {
  return clave in TOURS;
}
