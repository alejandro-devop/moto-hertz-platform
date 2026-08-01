import { textoBuscable } from '@/lib/format';
import {
  contarFiltrosActivos as contarActivos,
  escribirParams,
  leerClave,
  leerPagina,
  leerTexto,
} from '@/lib/list-params';
import type { Banner } from '@/lib/graphql/banners';

/**
 * La papelera es un valor del filtro de estado, igual que en el resto de los
 * módulos (PATRON.md §1.1).
 */
export type Estado = 'activos' | 'papelera';

export interface Filtros {
  q: string;
  estado: Estado;
  pagina: number;
}

export const FILTROS_POR_DEFECTO: Filtros = {
  q: '',
  estado: 'activos',
  pagina: 1,
};

export const ETIQUETAS_ESTADO: Record<Estado, string> = {
  activos: 'En el sitio',
  papelera: 'En papelera',
};

/** Los filtros viven en la URL: se pueden compartir y el botón de atrás sirve. */
export function leerFiltros(params: URLSearchParams): Filtros {
  return {
    q: leerTexto(params, 'q'),
    estado: leerClave(params, 'estado', ETIQUETAS_ESTADO, 'activos'),
    pagina: leerPagina(params),
  };
}

export function escribirFiltros(filtros: Filtros): URLSearchParams {
  return escribirParams(filtros, FILTROS_POR_DEFECTO);
}

export function contarFiltrosActivos(filtros: Filtros): number {
  return contarActivos(filtros, FILTROS_POR_DEFECTO);
}

function textoDeBanner(banner: Banner): string {
  return textoBuscable(banner.title, banner.subtitle, banner.linkLabel);
}

/**
 * El filtro de papelera **no se aplica aquí**: activos y papelera son dos
 * consultas distintas al backend (`trashed`).
 *
 * **No hay selector de "ordenar por"**, a diferencia del resto de los
 * módulos: el orden siempre es por `position`, porque el orden *es* el dato
 * que se edita a mano (subir/bajar o arrastrar) — un desplegable de orden
 * competiría con eso.
 */
export function aplicarFiltros(banners: Banner[], filtros: Filtros): Banner[] {
  const busqueda = textoBuscable(filtros.q.trim());
  const filtrados = busqueda
    ? banners.filter((banner) => textoDeBanner(banner).includes(busqueda))
    : banners;

  return [...filtrados].sort((a, b) => a.position - b.position);
}
