import type { Motorcycle } from '@/lib/graphql/motorcycles';
import { getPaperwork, getPublication } from '@/lib/motorcycle-status';

export const POR_PAGINA = 25;

export type Estado = 'todas' | 'publicadas' | 'incompletas' | 'fuera';
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
};

export const ETIQUETAS_CONDICION: Record<Condicion, string> = {
  todas: 'Nuevas y usadas',
  NEW: 'Nuevas',
  USED: 'Usadas',
};

function esOrden(value: string | null): value is Orden {
  return value !== null && value in ETIQUETAS_ORDEN;
}

/** Los filtros viven en la URL: se pueden compartir y el botón de atrás sirve. */
export function leerFiltros(params: URLSearchParams): Filtros {
  const estado = params.get('estado');
  const condicion = params.get('condicion');
  const orden = params.get('orden');
  const pagina = Number(params.get('pagina') ?? '1');

  return {
    q: params.get('q') ?? '',
    estado: estado && estado in ETIQUETAS_ESTADO ? (estado as Estado) : 'todas',
    condicion: condicion === 'NEW' || condicion === 'USED' ? condicion : 'todas',
    marca: params.get('marca') ?? TODAS,
    sede: params.get('sede') ?? TODAS,
    papeles: params.get('papeles') === 'atencion' ? 'atencion' : 'todos',
    orden: esOrden(orden) ? orden : 'nombre',
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1,
  };
}

/** Serializa solo lo que se desvía del valor por defecto, para no ensuciar la URL. */
export function escribirFiltros(filtros: Filtros): URLSearchParams {
  const params = new URLSearchParams();
  if (filtros.q) params.set('q', filtros.q);
  if (filtros.estado !== 'todas') params.set('estado', filtros.estado);
  if (filtros.condicion !== 'todas') params.set('condicion', filtros.condicion);
  if (filtros.marca !== TODAS) params.set('marca', filtros.marca);
  if (filtros.sede !== TODAS) params.set('sede', filtros.sede);
  if (filtros.papeles !== 'todos') params.set('papeles', filtros.papeles);
  if (filtros.orden !== 'nombre') params.set('orden', filtros.orden);
  if (filtros.pagina > 1) params.set('pagina', String(filtros.pagina));
  return params;
}

/** Cuántos filtros están puestos, sin contar la búsqueda ni el orden. */
export function contarFiltrosActivos(filtros: Filtros): number {
  let total = 0;
  if (filtros.estado !== 'todas') total += 1;
  if (filtros.condicion !== 'todas') total += 1;
  if (filtros.marca !== TODAS) total += 1;
  if (filtros.sede !== TODAS) total += 1;
  if (filtros.papeles !== 'todos') total += 1;
  return total;
}

function normalizar(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Texto sobre el que busca el buscador de la barra superior. */
function textoBuscable(motorcycle: Motorcycle): string {
  return normalizar(
    [
      motorcycle.name,
      motorcycle.brand,
      motorcycle.slug,
      motorcycle.category,
      motorcycle.year,
      motorcycle.location?.name,
      motorcycle.location?.city,
      motorcycle.paperwork?.registrationCity,
    ]
      .filter(Boolean)
      .join(' ')
  );
}

function precioNumerico(motorcycle: Motorcycle): number | null {
  if (!motorcycle.price) return null;
  const n = Number(motorcycle.price);
  return Number.isFinite(n) ? n : null;
}

/** Los registros sin dato van al final, sin importar la dirección del orden. */
function compararConNulosAlFinal(a: number | null, b: number | null, desc: boolean): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return desc ? b - a : a - b;
}

export function aplicarFiltros(motorcycles: Motorcycle[], filtros: Filtros): Motorcycle[] {
  const busqueda = normalizar(filtros.q.trim());

  const filtradas = motorcycles.filter((motorcycle) => {
    if (busqueda && !textoBuscable(motorcycle).includes(busqueda)) return false;

    if (filtros.condicion !== 'todas' && motorcycle.condition !== filtros.condicion) return false;
    if (filtros.marca !== TODAS && motorcycle.brand !== filtros.marca) return false;
    if (filtros.sede !== TODAS && motorcycle.location?.name !== filtros.sede) return false;

    if (filtros.estado !== 'todas') {
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
        return compararConNulosAlFinal(precioNumerico(a), precioNumerico(b), true);
      case 'precio-asc':
        return compararConNulosAlFinal(precioNumerico(a), precioNumerico(b), false);
      case 'anio-desc':
        return compararConNulosAlFinal(a.year ?? null, b.year ?? null, true);
      case 'anio-asc':
        return compararConNulosAlFinal(a.year ?? null, b.year ?? null, false);
      default:
        return a.name.localeCompare(b.name, 'es');
    }
  });

  return ordenadas;
}

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
