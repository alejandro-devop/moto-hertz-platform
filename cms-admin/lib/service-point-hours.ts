/**
 * Horarios de un punto de atención, para leerlos y para editarlos.
 *
 * La forma que guarda el backend es `{ monday: { open: '09:15', close: '17:00' }, … }`
 * y **un día ausente está cerrado** (ver
 * `backend/src/types/services/service-point.types.ts`). Aquí vive lo que el
 * panel necesita para mostrarlo en cristiano.
 */
import type { ServicePointDayHours, ServicePointHours } from '@/lib/graphql/service-points';

export const DIAS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type Dia = (typeof DIAS)[number];

export const ETIQUETAS_DIA: Record<Dia, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

/** Etiqueta de tres letras para la fila de la lista. */
export const ETIQUETAS_DIA_CORTA: Record<Dia, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mié',
  thursday: 'Jue',
  friday: 'Vie',
  saturday: 'Sáb',
  sunday: 'Dom',
};

/** `"09:15"` → `"9:15 a. m."`, en el formato que se lee en Colombia. */
export function formatHora(valor?: string | null): string {
  if (!valor || !/^\d{1,2}:\d{2}$/.test(valor)) return '';
  const [h, m] = valor.split(':').map(Number);
  const sufijo = h < 12 ? 'a. m.' : 'p. m.';
  const hora12 = h % 12 === 0 ? 12 : h % 12;
  return `${hora12}:${String(m).padStart(2, '0')} ${sufijo}`;
}

export function formatTramo(dia?: ServicePointDayHours | null): string {
  if (!dia?.open || !dia?.close) return 'Cerrado';
  return `${formatHora(dia.open)} – ${formatHora(dia.close)}`;
}

/** Cuántos días de la semana abre. Cero = no hay horario cargado. */
export function diasAbiertos(hours?: ServicePointHours | null): Dia[] {
  if (!hours) return [];
  return DIAS.filter((dia) => Boolean(hours[dia]?.open && hours[dia]?.close));
}

/**
 * Una línea para la lista: «Lun–Jue 9:15 a. m. – 5:00 p. m. · Vie 9:15 a. m. –
 * 4:00 p. m.». Los días seguidos con el mismo horario se agrupan; si hay más de
 * dos grupos distintos, los demás se resumen en «+N».
 */
export function resumenHorario(hours?: ServicePointHours | null): string {
  const abiertos = diasAbiertos(hours);
  if (abiertos.length === 0) return 'Sin horario';

  const grupos: { dias: Dia[]; tramo: string }[] = [];
  for (const dia of abiertos) {
    const tramo = formatTramo(hours![dia]);
    const ultimo = grupos[grupos.length - 1];
    const seguido = ultimo && DIAS.indexOf(dia) === DIAS.indexOf(ultimo.dias[ultimo.dias.length - 1]) + 1;
    if (ultimo && seguido && ultimo.tramo === tramo) ultimo.dias.push(dia);
    else grupos.push({ dias: [dia], tramo });
  }

  const visibles = grupos
    .slice(0, 2)
    .map((grupo) => `${tramoDeDias(grupo.dias)} ${grupo.tramo}`)
    .join(' · ');

  const resto = grupos.length - 2;
  return resto > 0 ? `${visibles} · +${resto}` : visibles;
}

/** `['monday','tuesday','friday']` → `"Lun–Mar, Vie"`. */
export function tramoDeDias(dias: Dia[]): string {
  if (dias.length === 0) return '';
  const indices = dias.map((dia) => DIAS.indexOf(dia)).sort((a, b) => a - b);
  const grupos: number[][] = [];

  for (const indice of indices) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && indice === ultimo[ultimo.length - 1] + 1) ultimo.push(indice);
    else grupos.push([indice]);
  }

  return grupos
    .map((grupo) => {
      const desde = ETIQUETAS_DIA_CORTA[DIAS[grupo[0]]];
      const hasta = ETIQUETAS_DIA_CORTA[DIAS[grupo[grupo.length - 1]]];
      return grupo.length === 1 ? desde : `${desde}–${hasta}`;
    })
    .join(', ');
}
