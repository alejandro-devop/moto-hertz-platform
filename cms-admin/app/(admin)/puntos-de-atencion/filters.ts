import { textoBuscable } from '@/lib/format';
import {
  compararTexto,
  contarFiltrosActivos as contarActivos,
  escribirParams,
  leerClave,
  leerPagina,
  leerTexto,
} from '@/lib/list-params';
import type { ServicePoint, ServicePointType } from '@/lib/graphql/service-points';
import { diasAbiertos } from '@/lib/service-point-hours';

/**
 * La papelera es un valor del filtro de estado, igual que en motos y en medios
 * (PATRON.md §1.1). Aquí no hay estado de publicación que valga —un punto de
 * atención está o no está—, así que el filtro tiene solo dos valores.
 */
export type Estado = 'activos' | 'papelera';
export type Tipo = 'todos' | ServicePointType;
export type Orden = 'nombre' | 'ciudad' | 'tipo';

export interface Filtros {
  q: string;
  estado: Estado;
  tipo: Tipo;
  orden: Orden;
  pagina: number;
}

export const FILTROS_POR_DEFECTO: Filtros = {
  q: '',
  estado: 'activos',
  tipo: 'todos',
  orden: 'nombre',
  pagina: 1,
};

export const ETIQUETAS_ESTADO: Record<Estado, string> = {
  activos: 'En el sitio',
  papelera: 'En papelera',
};

/**
 * El catálogo cerrado de tipos, en español. **Si el backend agrega un valor al
 * enum `ServicePointType`, va también aquí** — es el único sitio del panel que
 * lo nombra.
 */
export const ETIQUETAS_TIPO: Record<Tipo, string> = {
  todos: 'Todos los tipos',
  SEDE: 'Sede',
  CONCESIONARIO: 'Concesionario',
  DISTRIBUIDOR: 'Distribuidor',
};

/** El tipo tal como se lee en una fila o en una insignia. */
export const ETIQUETA_DE_TIPO: Record<ServicePointType, string> = {
  SEDE: 'Sede',
  CONCESIONARIO: 'Concesionario',
  DISTRIBUIDOR: 'Distribuidor',
};

export const ETIQUETAS_ORDEN: Record<Orden, string> = {
  nombre: 'Nombre A–Z',
  ciudad: 'Por ciudad',
  tipo: 'Por tipo',
};

/** Los filtros viven en la URL: se pueden compartir y el botón de atrás sirve. */
export function leerFiltros(params: URLSearchParams): Filtros {
  return {
    q: leerTexto(params, 'q'),
    estado: leerClave(params, 'estado', ETIQUETAS_ESTADO, 'activos'),
    tipo: leerClave(params, 'tipo', ETIQUETAS_TIPO, 'todos'),
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

/** La dirección completa, para mostrarla y para buscar sobre ella. */
export function direccionCompleta(punto: ServicePoint): string {
  const { street, neighborhood, city, state } = punto.address ?? {};
  return [street, neighborhood, city, state].filter(Boolean).join(', ');
}

/** Se busca por nombre y por dirección; el teléfono también, que se pregunta. */
function textoDePunto(punto: ServicePoint): string {
  return textoBuscable(
    punto.name,
    punto.slug,
    direccionCompleta(punto),
    punto.phone,
    punto.whatsapp,
    punto.email
  );
}

/**
 * El filtro de papelera **no se aplica aquí**: activos y papelera son dos
 * consultas distintas al backend (`trashed`).
 */
export function aplicarFiltros(puntos: ServicePoint[], filtros: Filtros): ServicePoint[] {
  const busqueda = textoBuscable(filtros.q.trim());

  const filtrados = puntos.filter((punto) => {
    if (busqueda && !textoDePunto(punto).includes(busqueda)) return false;
    if (filtros.tipo !== 'todos' && punto.type !== filtros.tipo) return false;
    return true;
  });

  const ordenados = [...filtrados];
  ordenados.sort((a, b) => {
    switch (filtros.orden) {
      case 'ciudad':
        return (
          compararTexto(a.address?.city ?? 'zzz', b.address?.city ?? 'zzz') ||
          compararTexto(a.name, b.name)
        );
      case 'tipo':
        return compararTexto(a.type, b.type) || compararTexto(a.name, b.name);
      default:
        return compararTexto(a.name, b.name);
    }
  });

  return ordenados;
}

/** Cuántos puntos no tienen horario cargado, para el aviso de la lista. */
export function contarSinHorario(puntos: ServicePoint[]): number {
  return puntos.filter((punto) => diasAbiertos(punto.hours).length === 0).length;
}
