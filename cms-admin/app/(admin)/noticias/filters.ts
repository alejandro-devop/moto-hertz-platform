import { textoBuscable } from '@/lib/format';
import {
  compararTexto,
  contarFiltrosActivos as contarActivos,
  escribirParams,
  leerClave,
  leerPagina,
  leerTexto,
} from '@/lib/list-params';
import type { News } from '@/lib/graphql/news';
import { ETIQUETAS_ESTADO_NOTICIA, getNewsStatus, type NewsStatus } from '@/lib/news-status';

/**
 * El estado tiene **cuatro** valores además de la papelera, a diferencia de
 * `service`/`service-point` donde solo hay activos/papelera: los tres que
 * deriva `getNewsStatus` (borrador, programada, publicada) más «todas». La
 * papelera sigue siendo un valor más de este mismo filtro (PATRON.md §1.1),
 * y dispara su propia consulta al backend.
 */
export type Estado = 'todas' | NewsStatus | 'papelera';
export type Destacado = 'todos' | 'si' | 'no';
/** «Más recientes primero» es el orden por defecto: aquí la fecha manda. */
export type Orden = 'reciente' | 'titulo' | 'categoria';

export interface Filtros {
  q: string;
  estado: Estado;
  /** `''` = todas. Texto libre, igual que en `servicios` (ver `categoriasDe`). */
  categoria: string;
  destacado: Destacado;
  orden: Orden;
  pagina: number;
}

export const FILTROS_POR_DEFECTO: Filtros = {
  q: '',
  estado: 'todas',
  categoria: '',
  destacado: 'todos',
  orden: 'reciente',
  pagina: 1,
};

export const ETIQUETAS_ESTADO: Record<Estado, string> = {
  todas: 'Todos los estados',
  ...ETIQUETAS_ESTADO_NOTICIA,
  papelera: 'En papelera',
};

export const ETIQUETAS_DESTACADO: Record<Destacado, string> = {
  todos: 'Destacadas y no',
  si: 'Solo destacadas',
  no: 'Sin destacar',
};

export const ETIQUETAS_ORDEN: Record<Orden, string> = {
  reciente: 'Más recientes primero',
  titulo: 'Título A–Z',
  categoria: 'Por categoría',
};

/** Los filtros viven en la URL: se pueden compartir y el botón de atrás sirve. */
export function leerFiltros(params: URLSearchParams): Filtros {
  return {
    q: leerTexto(params, 'q'),
    estado: leerClave(params, 'estado', ETIQUETAS_ESTADO, 'todas'),
    categoria: leerTexto(params, 'categoria'),
    destacado: leerClave(params, 'destacado', ETIQUETAS_DESTACADO, 'todos'),
    orden: leerClave(params, 'orden', ETIQUETAS_ORDEN, 'reciente'),
    pagina: leerPagina(params),
  };
}

export function escribirFiltros(filtros: Filtros): URLSearchParams {
  return escribirParams(filtros, FILTROS_POR_DEFECTO);
}

export function contarFiltrosActivos(filtros: Filtros): number {
  return contarActivos(filtros, FILTROS_POR_DEFECTO);
}

/** Las categorías que hay hoy, en orden alfabético (ver `servicios/filters.ts`). */
export function categoriasDe(noticias: News[]): string[] {
  const nombres = new Set<string>();
  for (const noticia of noticias) {
    const categoria = noticia.category?.trim();
    if (categoria) nombres.add(categoria);
  }
  return [...nombres].sort(compararTexto);
}

/** Se busca por título, autor y categoría: lo que se recuerda de una noticia. */
function textoDeNoticia(noticia: News): string {
  return textoBuscable(noticia.title, noticia.slug, noticia.author, noticia.category);
}

/**
 * El filtro de papelera **no se aplica aquí**: activos y papelera son dos
 * consultas distintas al backend (`trashed`). Los otros tres estados
 * (borrador/programada/publicada) sí se filtran en memoria, sobre lo que ya
 * trajo la consulta de «activos».
 */
export function aplicarFiltros(noticias: News[], filtros: Filtros): News[] {
  const busqueda = textoBuscable(filtros.q.trim());

  const filtradas = noticias.filter((noticia) => {
    if (busqueda && !textoDeNoticia(noticia).includes(busqueda)) return false;
    if (filtros.estado !== 'todas' && filtros.estado !== 'papelera') {
      if (getNewsStatus(noticia.publishedAt) !== filtros.estado) return false;
    }
    if (filtros.categoria && (noticia.category ?? '') !== filtros.categoria) return false;
    if (filtros.destacado === 'si' && !noticia.featured) return false;
    if (filtros.destacado === 'no' && noticia.featured) return false;
    return true;
  });

  const ordenadas = [...filtradas];
  ordenadas.sort((a, b) => {
    switch (filtros.orden) {
      case 'titulo':
        return compararTexto(a.title, b.title);
      case 'categoria':
        return (
          compararTexto(a.category || 'zzz', b.category || 'zzz') || compararTexto(a.title, b.title)
        );
      default: {
        /* Sin `publishedAt` (borrador) no hay con qué ordenar por fecha: cae
           al final, como los precios sin monto en `servicios`. */
        const fechaA = a.publishedAt ? new Date(a.publishedAt).getTime() : -Infinity;
        const fechaB = b.publishedAt ? new Date(b.publishedAt).getTime() : -Infinity;
        return fechaB - fechaA || compararTexto(a.title, b.title);
      }
    }
  });

  return ordenadas;
}
