/**
 * Mecánica de las listas del panel: filtros en la URL, orden y paginación.
 *
 * Lo que hay aquí no sabe nada de motos, noticias ni servicios — cada módulo
 * declara sus propios filtros (`app/(admin)/<ruta>/filters.ts`) y usa estas
 * piezas para leerlos, escribirlos y cortar la lista en páginas.
 */

export const POR_PAGINA = 25;

/* ------------------------------------------------------- leer de la URL --- */

export function leerTexto(params: URLSearchParams, clave: string): string {
  return params.get(clave) ?? '';
}

/** Lee un filtro de valores cerrados; cualquier basura cae en el valor por defecto. */
export function leerOpcion<T extends string>(
  params: URLSearchParams,
  clave: string,
  opciones: readonly T[],
  porDefecto: T
): T {
  const value = params.get(clave);
  return value !== null && (opciones as readonly string[]).includes(value) ? (value as T) : porDefecto;
}

/** Igual que `leerOpcion`, pero las opciones vienen de un mapa de etiquetas. */
export function leerClave<T extends string>(
  params: URLSearchParams,
  clave: string,
  etiquetas: Record<T, string>,
  porDefecto: T
): T {
  return leerOpcion(params, clave, Object.keys(etiquetas) as T[], porDefecto);
}

export function leerPagina(params: URLSearchParams, clave = 'pagina'): number {
  const pagina = Number(params.get(clave) ?? '1');
  return Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1;
}

/* --------------------------------------------------- escribir en la URL --- */

/**
 * Serializa solo lo que se desvía del valor por defecto, para no ensuciar la
 * URL. El orden de los parámetros es el de las claves del objeto por defecto.
 */
export function escribirParams<T extends object>(filtros: T, porDefecto: T): URLSearchParams {
  const params = new URLSearchParams();
  for (const clave of Object.keys(porDefecto) as (keyof T)[]) {
    const value = filtros[clave];
    if (value === porDefecto[clave]) continue;
    if (value === '' || value === null || value === undefined) continue;
    params.set(String(clave), String(value));
  }
  return params;
}

/**
 * Cuántos filtros están puestos. La búsqueda, el orden y la página no cuentan:
 * se ven solos en su propio control, y el contador es para saber cuánto hay
 * escondido detrás del botón «Filtros» del móvil.
 */
export const NO_SON_FILTROS = ['q', 'orden', 'pagina'] as const;

export function contarFiltrosActivos<T extends object>(
  filtros: T,
  porDefecto: T,
  excluir: readonly string[] = NO_SON_FILTROS
): number {
  return (Object.keys(porDefecto) as (keyof T)[]).filter(
    (clave) => !excluir.includes(String(clave)) && filtros[clave] !== porDefecto[clave]
  ).length;
}

/* ----------------------------------------------------------- comparar --- */

/** Los registros sin dato van al final, sin importar la dirección del orden. */
export function compararNulosAlFinal(a: number | null, b: number | null, desc: boolean): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return desc ? b - a : a - b;
}

/** Orden alfabético en español (la ñ y las tildes donde el lector las espera). */
export function compararTexto(a: string, b: string): number {
  return a.localeCompare(b, 'es');
}

/* ---------------------------------------------------------- paginación --- */

export interface Pagina<T> {
  items: T[];
  pagina: number;
  paginas: number;
  desde: number;
  hasta: number;
  total: number;
}

export function paginar<T>(items: T[], pagina: number, porPagina = POR_PAGINA): Pagina<T> {
  const paginas = Math.max(1, Math.ceil(items.length / porPagina));
  /* Si se filtró y la página actual ya no existe, se cae a la última. */
  const actual = Math.min(Math.max(1, pagina), paginas);
  const desde = (actual - 1) * porPagina;
  const hasta = Math.min(desde + porPagina, items.length);
  return {
    items: items.slice(desde, hasta),
    pagina: actual,
    paginas,
    desde: items.length === 0 ? 0 : desde + 1,
    hasta,
    total: items.length,
  };
}
