/**
 * El anclaje de los recorridos guiados. Una sola forma de marcar un elemento y
 * una sola forma de buscarlo, para que el atributo y el selector no se
 * escriban en dos sitios distintos y se desincronicen.
 *
 * Uso en el componente:
 *
 * ```tsx
 * <nav {...tourAnchor('panel.rail')} … >
 * ```
 */

export const ATRIBUTO_TOUR = 'data-tour';

/** Marca un elemento como ancla de un paso. Se esparce en el JSX. */
export function tourAnchor(clave: string): Record<string, string> {
  return { [ATRIBUTO_TOUR]: clave };
}

/** El selector CSS del ancla, que es lo que consume `driver.js`. */
export function selectorTour(clave: string): string {
  return `[${ATRIBUTO_TOUR}="${clave}"]`;
}

/**
 * El elemento que hay que señalar, o `null` si no hay ninguno **visible**.
 *
 * Que devuelva el primero *visible* y no simplemente el primero es lo que
 * permite que la misma clave sirva en las dos pantallas. Media interfaz del
 * panel está duplicada a propósito —la tabla y las tarjetas, el menú de fila y
 * la hoja inferior, la paginación de escritorio y la de móvil— y las dos
 * copias están siempre en el DOM: lo que cambia es cuál tiene `display: none`.
 * Con un `querySelector` a secas, `lista.tabla` en un teléfono devolvería la
 * tabla de escritorio, que está ahí pero no se ve.
 *
 * De aquí sale también la regla dura del sistema: un paso sin elemento visible
 * se salta en silencio. El recorrido de una lista vacía no puede reventar.
 */
export function elementoDeAncla(clave: string): HTMLElement | null {
  const candidatos = document.querySelectorAll(selectorTour(clave));
  for (const candidato of candidatos) {
    if (!(candidato instanceof HTMLElement)) continue;
    if (candidato.offsetWidth > 0 || candidato.offsetHeight > 0) return candidato;
  }
  return null;
}

export function anclaVisible(clave: string): boolean {
  return elementoDeAncla(clave) !== null;
}
