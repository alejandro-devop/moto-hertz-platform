import type {
  ServicePointDayHours,
  ServicePointHours,
} from "@/types/service-point";

/**
 * Horarios para leerlos en el sitio.
 *
 * El backend los guarda como `{ monday: { open: "09:15", close: "17:00" }, … }`
 * y **un día ausente está cerrado** (ver
 * `backend/src/types/services/service-point.types.ts`). Aquí se agrupan los
 * días seguidos con el mismo horario, que es como los pega cualquiera en su
 * vitrina: «Lunes a viernes 9:15 a. m. – 5:00 p. m.».
 */

const DIAS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type Dia = (typeof DIAS)[number];

const ETIQUETA: Record<Dia, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

/** `"09:15"` → `"9:15 a. m."`. */
export function formatHora(valor?: string | null): string {
  if (!valor || !/^\d{1,2}:\d{2}$/.test(valor)) return "";
  const [h, m] = valor.split(":").map(Number);
  const sufijo = h < 12 ? "a. m." : "p. m.";
  const hora12 = h % 12 === 0 ? 12 : h % 12;
  return `${hora12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

export interface TramoHorario {
  /** «Lunes a viernes», «Sábado». */
  dias: string;
  /** «9:15 a. m. – 5:00 p. m.» o «Cerrado». */
  horas: string;
}

function tramoDe(dia?: ServicePointDayHours | null): string | null {
  if (!dia?.open || !dia?.close) return null;
  return `${formatHora(dia.open)} – ${formatHora(dia.close)}`;
}

/**
 * Los siete días agrupados en tramos seguidos con el mismo horario. Los días
 * cerrados también salen: saber que el domingo no abren es la mitad de la
 * información.
 */
export function tramosDeHorario(hours?: ServicePointHours | null): TramoHorario[] {
  if (!hours) return [];

  const porDia = DIAS.map((dia) => ({ dia, horas: tramoDe(hours[dia]) }));
  if (porDia.every((item) => item.horas === null)) return [];

  const tramos: TramoHorario[] = [];
  let inicio = 0;

  for (let i = 0; i <= porDia.length; i += 1) {
    const distinto = i === porDia.length || porDia[i].horas !== porDia[inicio].horas;
    if (!distinto) continue;

    const desde = ETIQUETA[porDia[inicio].dia];
    const hasta = ETIQUETA[porDia[i - 1].dia];
    tramos.push({
      dias: inicio === i - 1 ? desde : `${desde} a ${hasta}`,
      horas: porDia[inicio].horas ?? "Cerrado",
    });
    inicio = i;
  }

  return tramos;
}

/** El enlace de WhatsApp a partir del número guardado. */
export function urlWhatsApp(numero?: string | null): string | null {
  const digitos = (numero ?? "").replace(/\D/g, "");
  return digitos.length >= 7 ? `https://wa.me/${digitos}` : null;
}
