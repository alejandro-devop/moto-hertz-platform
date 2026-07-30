import { daysUntil, formatDate, humanizeDays } from '@/lib/format';
import type { Motorcycle } from '@/lib/graphql/motorcycles';

/* -------------------------------------------------------------------------- *
 * Estado de publicación
 *
 * El backend todavía no tiene un campo `status`: solo `available` y
 * `featured`. Los tres estados de abajo se derivan de los datos que ya hay,
 * para que la lista distinga «lista para el sitio» de «le falta algo».
 * Si algún día el backend expone un `status` real, esto se reemplaza por él.
 * -------------------------------------------------------------------------- */

export type PublicationLevel = 'publicada' | 'incompleta' | 'fuera';

export interface Publication {
  level: PublicationLevel;
  label: string;
  /** Qué le falta para poder publicarse. Vacío cuando está completa. */
  missing: string[];
}

/** Lo mínimo que una ficha necesita para servir en el sitio público. */
function missingForPublication(motorcycle: Motorcycle): string[] {
  const missing: string[] = [];
  if (!motorcycle.price) missing.push('precio');
  if (!motorcycle.images?.main) missing.push('foto de portada');
  if (!motorcycle.brand) missing.push('marca');
  if (motorcycle.condition === 'USED' && motorcycle.mileageKm === null) {
    missing.push('kilometraje');
  }
  return missing;
}

export function getPublication(motorcycle: Motorcycle): Publication {
  if (!motorcycle.available) {
    return { level: 'fuera', label: 'Fuera del sitio', missing: [] };
  }
  const missing = missingForPublication(motorcycle);
  if (missing.length > 0) {
    return { level: 'incompleta', label: 'Incompleta', missing };
  }
  return { level: 'publicada', label: 'Publicada', missing: [] };
}

/* -------------------------------------------------------------------------- *
 * Papeles
 *
 * SOAT y tecnomecánica son los únicos datos del catálogo que caducan solos,
 * así que el panel avisa antes de que un comprador lo note. Solo aplican a
 * motos usadas.
 * -------------------------------------------------------------------------- */

/** Umbral de aviso: a partir de aquí la moto sale en la franja de alertas. */
export const DIAS_DE_AVISO = 30;

export type PaperLevel = 'vigente' | 'por-vencer' | 'vencido' | 'sin-registrar' | 'no-aplica';

export interface PaperStatus {
  level: PaperLevel;
  /** Etiqueta corta para la lista: «SOAT en 12 días». */
  label: string;
  /** Frase completa para la ficha: «Vence el 10 ago 2026 (en 12 días).» */
  detail: string;
  days: number | null;
}

const SEVERIDAD: Record<PaperLevel, number> = {
  vencido: 4,
  'por-vencer': 3,
  'sin-registrar': 2,
  vigente: 1,
  'no-aplica': 0,
};

/** «SOAT vencido» pero «tecnomecánica vencida»: el género va con el papel. */
type Genero = 'm' | 'f';

function paperStatus(
  nombre: string,
  genero: Genero,
  expiresAt?: string | null
): PaperStatus {
  const days = daysUntil(expiresAt);

  if (days === null) {
    return {
      level: 'sin-registrar',
      label: `${nombre} sin registrar`,
      detail: 'Sin fecha registrada.',
      days: null,
    };
  }

  const fecha = formatDate(expiresAt);

  if (days < 0) {
    return {
      level: 'vencido',
      label: `${nombre} ${genero === 'f' ? 'vencida' : 'vencido'}`,
      detail: `Venció el ${fecha} (${humanizeDays(days)}).`,
      days,
    };
  }

  if (days <= DIAS_DE_AVISO) {
    return {
      level: 'por-vencer',
      label: `${nombre} ${humanizeDays(days)}`,
      detail: `Vence el ${fecha} (${humanizeDays(days)}).`,
      days,
    };
  }

  return {
    level: 'vigente',
    label: `${nombre} al día`,
    detail: `Vigente hasta el ${fecha}.`,
    days,
  };
}

export interface Paperwork {
  soat: PaperStatus;
  tecnomecanica: PaperStatus;
  /** El peor de los dos, que es lo que se muestra en la lista. */
  worst: PaperStatus;
  /** `true` cuando algo está vencido o por vencer. */
  needsAttention: boolean;
}

const NO_APLICA: PaperStatus = {
  level: 'no-aplica',
  label: 'No aplica',
  detail: 'Las motos nuevas no tienen papeles por vencer.',
  days: null,
};

export function getPaperwork(motorcycle: Motorcycle): Paperwork {
  if (motorcycle.condition !== 'USED') {
    return {
      soat: NO_APLICA,
      tecnomecanica: NO_APLICA,
      worst: NO_APLICA,
      needsAttention: false,
    };
  }

  const soat = paperStatus('SOAT', 'm', motorcycle.paperwork?.soatExpiresAt);
  const tecnomecanica = paperStatus(
    'Tecnomecánica',
    'f',
    motorcycle.paperwork?.technicalInspectionExpiresAt
  );
  const worst =
    SEVERIDAD[soat.level] >= SEVERIDAD[tecnomecanica.level] ? soat : tecnomecanica;

  /* «Sin registrar» no es una alerta: es un dato que falta, no uno que caduca. */
  const needsAttention = worst.level === 'vencido' || worst.level === 'por-vencer';

  return { soat, tecnomecanica, worst, needsAttention };
}

/** Cuántas motos de la lista tienen papeles vencidos o por vencer. */
export function countNeedingAttention(motorcycles: Motorcycle[]): number {
  return motorcycles.filter((motorcycle) => getPaperwork(motorcycle).needsAttention).length;
}
