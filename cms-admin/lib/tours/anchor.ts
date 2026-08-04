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
 * ¿Está el ancla en el DOM y visible? De aquí sale la regla dura del sistema:
 * un paso cuya ancla no existe se salta en silencio. Una lista vacía no tiene
 * filas, y el recorrido de una lista vacía no puede reventar.
 *
 * Se comprueba también que ocupe espacio: en el panel, «no existe en esta
 * pantalla» casi siempre se escribe como `hidden md:flex`, y un elemento con
 * `display: none` está en el DOM pero no se puede señalar.
 */
export function anclaVisible(clave: string): boolean {
  const elemento = document.querySelector(selectorTour(clave));
  if (!(elemento instanceof HTMLElement)) return false;
  return elemento.offsetWidth > 0 || elemento.offsetHeight > 0;
}
