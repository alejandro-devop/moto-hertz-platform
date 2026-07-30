/**
 * Formateo para lectura humana. Todo en es-CO: separador de miles con punto y
 * pesos sin decimales, que es como el catálogo maneja los precios.
 */

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const MILES = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

const FECHA_LARGA = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** `"8900000"` → `"$ 8.900.000"`. Devuelve `null` si no hay precio. */
export function formatCop(value?: string | number | null): string | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return COP.format(n).replace(/\s+/g, ' ');
}

/** `14320` → `"14.320"`. Para kilometraje y cualquier entero suelto. */
export function formatMiles(value?: string | number | null): string | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return MILES.format(n);
}

/**
 * Agrupa de tres en tres mientras se escribe, para que un cero de más no pase
 * desapercibido. Descarta todo lo que no sea dígito.
 */
export function groupDigits(input: string): string {
  const digits = input.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  return MILES.format(Number(digits));
}

/** Inversa de `groupDigits`: deja solo los dígitos, listo para el backend. */
export function onlyDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/** Normaliza a `YYYY-MM-DD`, tolerando fechas que lleguen con hora. */
export function toDateInput(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

/** `"2026-08-10"` → `"10 ago 2026"`. */
export function formatDate(value?: string | null): string | null {
  const iso = toDateInput(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return FECHA_LARGA.format(date);
}

/**
 * Días desde hoy hasta la fecha dada. Negativo si ya pasó, `null` si no hay
 * fecha válida. Se compara a medianoche UTC para que no dependa de la zona.
 */
export function daysUntil(value?: string | null): number | null {
  const iso = toDateInput(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const target = new Date(`${iso}T00:00:00Z`).getTime();
  if (Number.isNaN(target)) return null;
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}

/** `12` → `"en 12 días"`, `-3` → `"hace 3 días"`, `0` → `"hoy"`. */
export function humanizeDays(days: number): string {
  if (days === 0) return 'hoy';
  const n = Math.abs(days);
  const unit = n === 1 ? 'día' : 'días';
  return days > 0 ? `en ${n} ${unit}` : `hace ${n} ${unit}`;
}

/**
 * Sin tildes y en minúsculas, para comparar texto escrito por humanos: quien
 * busca «medellin» tiene que encontrar «Medellín».
 */
export function normalizarTexto(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Junta los campos por los que se puede buscar un registro en un solo texto ya
 * normalizado. Los vacíos se caen solos.
 */
export function textoBuscable(...partes: (string | number | null | undefined)[]): string {
  return normalizarTexto(partes.filter(Boolean).join(' '));
}

/** `"Yamaha NMAX 155 V3"` + `2027` → `"yamaha-nmax-155-v3-2027"`. */
export function slugify(...parts: (string | number | null | undefined)[]): string {
  const texto = parts
    .filter((part) => part !== null && part !== undefined && part !== '')
    .join(' ');
  return normalizarTexto(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
