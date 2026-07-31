import { textoBuscable } from '@/lib/format';
import {
  compararTexto,
  contarFiltrosActivos as contarActivos,
  escribirParams,
  leerClave,
  leerPagina,
  leerTexto,
} from '@/lib/list-params';
import type { Service } from '@/lib/graphql/services';
import { modoDePrecio } from '@/lib/service-pricing';

/**
 * La papelera es un valor del filtro de estado, igual que en motos, medios y
 * puntos de atención (PATRON.md §1.1). Un servicio está en el sitio o está en
 * la papelera: no hay estado de publicación derivado como en motos.
 */
export type Estado = 'activos' | 'papelera';
export type Destacado = 'todos' | 'si' | 'no';
export type Orden = 'nombre' | 'categoria' | 'precio';

export interface Filtros {
  q: string;
  estado: Estado;
  /**
   * `''` = todas. **No es un catálogo cerrado**: la categoría es texto libre y
   * las opciones del desplegable salen de los servicios que ya existen (ver
   * `categoriasDe`). Por eso se lee con `leerTexto` y no con `leerClave`.
   */
  categoria: string;
  destacado: Destacado;
  orden: Orden;
  pagina: number;
}

export const FILTROS_POR_DEFECTO: Filtros = {
  q: '',
  estado: 'activos',
  categoria: '',
  destacado: 'todos',
  orden: 'nombre',
  pagina: 1,
};

export const ETIQUETAS_ESTADO: Record<Estado, string> = {
  activos: 'En el sitio',
  papelera: 'En papelera',
};

export const ETIQUETAS_DESTACADO: Record<Destacado, string> = {
  todos: 'Destacados y no',
  si: 'Solo destacados',
  no: 'Sin destacar',
};

export const ETIQUETAS_ORDEN: Record<Orden, string> = {
  nombre: 'Nombre A–Z',
  categoria: 'Por categoría',
  precio: 'Precio (mayor primero)',
};

/** Los filtros viven en la URL: se pueden compartir y el botón de atrás sirve. */
export function leerFiltros(params: URLSearchParams): Filtros {
  return {
    q: leerTexto(params, 'q'),
    estado: leerClave(params, 'estado', ETIQUETAS_ESTADO, 'activos'),
    categoria: leerTexto(params, 'categoria'),
    destacado: leerClave(params, 'destacado', ETIQUETAS_DESTACADO, 'todos'),
    orden: leerClave(params, 'orden', ETIQUETAS_ORDEN, 'nombre'),
    pagina: leerPagina(params),
  };
}

export function escribirFiltros(filtros: Filtros): URLSearchParams {
  return escribirParams(filtros, FILTROS_POR_DEFECTO);
}

export function contarFiltrosActivos(filtros: Filtros): number {
  return contarActivos(filtros, FILTROS_POR_DEFECTO);
}

/**
 * Las categorías que hay hoy, en orden alfabético. El desplegable se arma con
 * esto: si mañana el usuario inventa «Personalización», aparece sola sin tocar
 * código.
 */
export function categoriasDe(servicios: Service[]): string[] {
  const nombres = new Set<string>();
  for (const servicio of servicios) {
    const categoria = servicio.category?.trim();
    if (categoria) nombres.add(categoria);
  }
  return [...nombres].sort(compararTexto);
}

/** Se busca por nombre, categoría y descripción corta: lo que se recuerda. */
function textoDeServicio(servicio: Service): string {
  return textoBuscable(
    servicio.name,
    servicio.slug,
    servicio.category,
    servicio.shortDescription,
    servicio.duration
  );
}

/** Para ordenar por precio: los que no tienen monto van al final. */
function montoDe(servicio: Service): number {
  if (modoDePrecio(servicio.pricing) === 'A_CONVENIR') return -1;
  return servicio.pricing?.amount ?? -1;
}

/**
 * El filtro de papelera **no se aplica aquí**: activos y papelera son dos
 * consultas distintas al backend (`trashed`).
 */
export function aplicarFiltros(servicios: Service[], filtros: Filtros): Service[] {
  const busqueda = textoBuscable(filtros.q.trim());

  const filtrados = servicios.filter((servicio) => {
    if (busqueda && !textoDeServicio(servicio).includes(busqueda)) return false;
    if (filtros.categoria && (servicio.category ?? '') !== filtros.categoria) return false;
    if (filtros.destacado === 'si' && !servicio.featured) return false;
    if (filtros.destacado === 'no' && servicio.featured) return false;
    return true;
  });

  const ordenados = [...filtrados];
  ordenados.sort((a, b) => {
    switch (filtros.orden) {
      case 'categoria':
        return (
          compararTexto(a.category || 'zzz', b.category || 'zzz') || compararTexto(a.name, b.name)
        );
      case 'precio':
        return montoDe(b) - montoDe(a) || compararTexto(a.name, b.name);
      default:
        return compararTexto(a.name, b.name);
    }
  });

  return ordenados;
}

/**
 * Cuántos servicios no se pueden presentar bien en el sitio todavía: sin
 * descripción corta no hay qué poner en la tarjeta.
 */
export function contarSinDescripcion(servicios: Service[]): number {
  return servicios.filter((servicio) => !servicio.shortDescription?.trim()).length;
}
