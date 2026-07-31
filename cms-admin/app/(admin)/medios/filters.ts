import { textoBuscable } from '@/lib/format';
import {
  compararNulosAlFinal,
  compararTexto,
  contarFiltrosActivos as contarActivos,
  escribirParams,
  leerClave,
  leerPagina,
  leerTexto,
} from '@/lib/list-params';
import type { Media } from '@/lib/graphql/media';

/** La papelera vive aquí mismo, como un estado más de la lista. */
export type Estado = 'biblioteca' | 'papelera';
export type Orden = 'recientes' | 'antiguas' | 'peso-desc' | 'nombre';

export interface Filtros {
  q: string;
  estado: Estado;
  orden: Orden;
  pagina: number;
}

export const FILTROS_POR_DEFECTO: Filtros = {
  q: '',
  estado: 'biblioteca',
  orden: 'recientes',
  pagina: 1,
};

export const ETIQUETAS_ESTADO: Record<Estado, string> = {
  biblioteca: 'Biblioteca',
  papelera: 'En papelera',
};

export const ETIQUETAS_ORDEN: Record<Orden, string> = {
  recientes: 'Más recientes primero',
  antiguas: 'Más antiguas primero',
  'peso-desc': 'Las que más pesan',
  nombre: 'Nombre A–Z',
};

export function leerFiltros(params: URLSearchParams): Filtros {
  return {
    q: leerTexto(params, 'q'),
    estado: leerClave(params, 'estado', ETIQUETAS_ESTADO, 'biblioteca'),
    orden: leerClave(params, 'orden', ETIQUETAS_ORDEN, 'recientes'),
    pagina: leerPagina(params),
  };
}

export function escribirFiltros(filtros: Filtros): URLSearchParams {
  return escribirParams(filtros, FILTROS_POR_DEFECTO);
}

export function contarFiltrosActivos(filtros: Filtros): number {
  return contarActivos(filtros, FILTROS_POR_DEFECTO);
}

function textoDeMedia(item: Media): string {
  return textoBuscable(item.originalName, item.key);
}

function fecha(item: Media): number {
  const t = new Date(item.createdAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * El filtro de papelera **no se aplica aquí**: biblioteca y papelera son dos
 * consultas distintas al backend (`trashed`). Aquí solo se busca y se ordena.
 */
export function aplicarFiltros(media: Media[], filtros: Filtros): Media[] {
  const busqueda = textoBuscable(filtros.q.trim());

  const filtradas = media.filter(
    (item) => !busqueda || textoDeMedia(item).includes(busqueda)
  );

  const ordenadas = [...filtradas];
  ordenadas.sort((a, b) => {
    switch (filtros.orden) {
      case 'antiguas':
        return compararNulosAlFinal(fecha(a), fecha(b), false);
      case 'peso-desc':
        return compararNulosAlFinal(a.sizeBytes, b.sizeBytes, true);
      case 'nombre':
        return compararTexto(a.originalName ?? a.key, b.originalName ?? b.key);
      default:
        return compararNulosAlFinal(fecha(a), fecha(b), true);
    }
  });

  return ordenadas;
}
