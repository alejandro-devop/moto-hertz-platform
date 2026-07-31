import { textoBuscable } from '@/lib/format';
import {
  compararNulosAlFinal,
  compararTexto,
  contarFiltrosActivos as contarActivos,
  escribirParams,
  leerClave,
  leerOpcion,
  leerPagina,
  leerTexto,
} from '@/lib/list-params';
import type { Motorcycle } from '@/lib/graphql/motorcycles';
import { getPaperwork, getPublication } from '@/lib/motorcycle-status';

export type Estado = 'todas' | 'publicadas' | 'incompletas' | 'fuera' | 'papelera';
export type Condicion = 'todas' | 'NEW' | 'USED';
export type Papeles = 'todos' | 'atencion';
export type Orden = 'nombre' | 'precio-desc' | 'precio-asc' | 'anio-desc' | 'anio-asc';

export interface Filtros {
  q: string;
  estado: Estado;
  condicion: Condicion;
  marca: string;
  sede: string;
  papeles: Papeles;
  orden: Orden;
  pagina: number;
}

export const TODAS = 'todas';

export const FILTROS_POR_DEFECTO: Filtros = {
  q: '',
  estado: 'todas',
  condicion: 'todas',
  marca: TODAS,
  sede: TODAS,
  papeles: 'todos',
  orden: 'nombre',
  pagina: 1,
};

export const ETIQUETAS_ORDEN: Record<Orden, string> = {
  nombre: 'Nombre A–Z',
  'precio-desc': 'Precio, mayor primero',
  'precio-asc': 'Precio, menor primero',
  'anio-desc': 'Año, más nuevas primero',
  'anio-asc': 'Año, más viejas primero',
};

export const ETIQUETAS_ESTADO: Record<Estado, string> = {
  todas: 'Todos los estados',
  publicadas: 'Publicadas',
  incompletas: 'Incompletas',
  fuera: 'Fuera del sitio',
  /* La papelera no es un estado de publicación sino otra lista: se pide al
     backend con `trashed`. Vive en el mismo desplegable porque es donde se
     busca «¿dónde quedó la moto que borré?». */
  papelera: 'En papelera',
};

export const ETIQUETAS_CONDICION: Record<Condicion, string> = {
  todas: 'Nuevas y usadas',
  NEW: 'Nuevas',
  USED: 'Usadas',
};

/* «Papeles por vencer» es un chip de un toque, no un desplegable: no necesita
   un mapa de etiquetas, solo sus dos valores posibles. */
const VALORES_PAPELES = ['todos', 'atencion'] as const;

/** Los filtros viven en la URL: se pueden compartir y el botón de atrás sirve. */
export function leerFiltros(params: URLSearchParams): Filtros {
  return {
    q: leerTexto(params, 'q'),
    estado: leerClave(params, 'estado', ETIQUETAS_ESTADO, 'todas'),
    condicion: leerClave(params, 'condicion', ETIQUETAS_CONDICION, 'todas'),
    marca: params.get('marca') ?? TODAS,
    sede: params.get('sede') ?? TODAS,
    papeles: leerOpcion(params, 'papeles', VALORES_PAPELES, 'todos'),
    orden: leerClave(params, 'orden', ETIQUETAS_ORDEN, 'nombre'),
    pagina: leerPagina(params),
  };
}

export function escribirFiltros(filtros: Filtros): URLSearchParams {
  return escribirParams(filtros, FILTROS_POR_DEFECTO);
}

/** Cuántos filtros están puestos, sin contar la búsqueda ni el orden. */
export function contarFiltrosActivos(filtros: Filtros): number {
  return contarActivos(filtros, FILTROS_POR_DEFECTO);
}

/** Texto sobre el que busca el buscador de la barra superior. */
function textoDeMoto(motorcycle: Motorcycle): string {
  return textoBuscable(
    motorcycle.name,
    motorcycle.brand,
    motorcycle.slug,
    motorcycle.category,
    motorcycle.year,
    motorcycle.location?.name,
    motorcycle.location?.city,
    motorcycle.paperwork?.registrationCity
  );
}

function precioNumerico(motorcycle: Motorcycle): number | null {
  if (!motorcycle.price) return null;
  const n = Number(motorcycle.price);
  return Number.isFinite(n) ? n : null;
}

export function aplicarFiltros(motorcycles: Motorcycle[], filtros: Filtros): Motorcycle[] {
  const busqueda = textoBuscable(filtros.q.trim());

  const filtradas = motorcycles.filter((motorcycle) => {
    if (busqueda && !textoDeMoto(motorcycle).includes(busqueda)) return false;

    if (filtros.condicion !== 'todas' && motorcycle.condition !== filtros.condicion) return false;
    if (filtros.marca !== TODAS && motorcycle.brand !== filtros.marca) return false;
    if (filtros.sede !== TODAS && motorcycle.location?.name !== filtros.sede) return false;

    /* En la papelera no hay estado de publicación que valga: la lista entera
       viene de otra consulta. */
    if (filtros.estado !== 'todas' && filtros.estado !== 'papelera') {
      const { level } = getPublication(motorcycle);
      if (filtros.estado === 'publicadas' && level !== 'publicada') return false;
      if (filtros.estado === 'incompletas' && level !== 'incompleta') return false;
      if (filtros.estado === 'fuera' && level !== 'fuera') return false;
    }

    if (filtros.papeles === 'atencion' && !getPaperwork(motorcycle).needsAttention) return false;

    return true;
  });

  const ordenadas = [...filtradas];
  ordenadas.sort((a, b) => {
    switch (filtros.orden) {
      case 'precio-desc':
        return compararNulosAlFinal(precioNumerico(a), precioNumerico(b), true);
      case 'precio-asc':
        return compararNulosAlFinal(precioNumerico(a), precioNumerico(b), false);
      case 'anio-desc':
        return compararNulosAlFinal(a.year ?? null, b.year ?? null, true);
      case 'anio-asc':
        return compararNulosAlFinal(a.year ?? null, b.year ?? null, false);
      default:
        return compararTexto(a.name, b.name);
    }
  });

  return ordenadas;
}
