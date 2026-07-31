import { z } from 'zod';
import { slugify } from '@/lib/format';
import { erroresDeZod, textoOpcional } from '@/lib/form-state';
import type { ResultadoValidacion } from '@/lib/use-ficha-state';
import { DIAS, ETIQUETAS_DIA, type Dia } from '@/lib/service-point-hours';
import type {
  ServicePoint,
  ServicePointFormInput,
  ServicePointHours,
  ServicePointType,
} from '@/lib/graphql/service-points';
import { seccionDeCampo, type SeccionId } from './form-sections';

/** Un día en la ficha: el interruptor y sus dos horas, aunque esté apagado. */
export interface DiaForm {
  abierto: boolean;
  open: string;
  close: string;
}

/**
 * El formulario es plano aunque el tipo `ServicePoint` sea anidado. La única
 * excepción es `hours`, que es una rejilla de 7×3 y no tiene sentido desarmar
 * en 21 campos sueltos: se compara igual con un `JSON.stringify`.
 */
export interface FormState {
  slug: string;
  /** `true` cuando alguien editó el slug a mano: deja de derivarse del nombre. */
  slugManual: boolean;
  name: string;
  type: ServicePointType;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string;
  email: string;
  /** El enlace de Google Maps tal cual se pegó; las coordenadas las saca el backend. */
  mapsUrl: string;
  hours: Record<Dia, DiaForm>;
}

/** Horario en blanco, con el tramo más común de la casa ya escrito. */
const DIA_VACIO: DiaForm = { abierto: false, open: '09:00', close: '18:00' };

function horasVacias(): Record<Dia, DiaForm> {
  return Object.fromEntries(DIAS.map((dia) => [dia, { ...DIA_VACIO }])) as Record<Dia, DiaForm>;
}

export const EMPTY_FORM: FormState = {
  slug: '',
  slugManual: false,
  name: '',
  type: 'SEDE',
  street: '',
  neighborhood: '',
  city: 'Medellín',
  state: 'Antioquia',
  phone: '',
  whatsapp: '',
  email: '',
  mapsUrl: '',
  hours: horasVacias(),
};

export function servicePointToForm(punto: ServicePoint): FormState {
  const hours = horasVacias();
  for (const dia of DIAS) {
    const guardado = punto.hours?.[dia];
    if (guardado?.open && guardado?.close) {
      hours[dia] = { abierto: true, open: guardado.open, close: guardado.close };
    }
  }

  return {
    slug: punto.slug,
    /* Un punto que ya existe conserva su slug: cambiarlo rompe su enlace. */
    slugManual: true,
    name: punto.name,
    type: punto.type,
    street: punto.address?.street ?? '',
    neighborhood: punto.address?.neighborhood ?? '',
    city: punto.address?.city ?? '',
    state: punto.address?.state ?? '',
    phone: punto.phone ?? '',
    whatsapp: punto.whatsapp ?? '',
    email: punto.email ?? '',
    mapsUrl: punto.location?.mapsUrl ?? '',
    hours,
  };
}

/** El slug se deriva del nombre mientras nadie lo haya tocado. */
export function slugSugerido(form: FormState): string {
  return slugify(form.name);
}

/** Solo viajan los días abiertos: un día ausente es un día cerrado. */
function horasDelForm(hours: Record<Dia, DiaForm>): ServicePointHours {
  const salida: ServicePointHours = {};
  for (const dia of DIAS) {
    const valor = hours[dia];
    if (valor.abierto && valor.open && valor.close) {
      salida[dia] = { open: valor.open, close: valor.close };
    }
  }
  return salida;
}

export function formToInput(form: FormState): ServicePointFormInput {
  const trim = textoOpcional;

  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    type: form.type,
    address: {
      street: trim(form.street),
      neighborhood: trim(form.neighborhood),
      city: trim(form.city),
      state: trim(form.state),
    },
    phone: trim(form.phone),
    whatsapp: trim(form.whatsapp),
    email: trim(form.email),
    /* Se manda siempre para poder **borrar** el enlace: `{ mapsUrl: undefined }`
       deja la ubicación vacía en vez de conservar la anterior. */
    location: { mapsUrl: trim(form.mapsUrl) },
    hours: horasDelForm(form.hours),
  };
}

/* -------------------------------------------------------------------------- *
 * Validación
 * -------------------------------------------------------------------------- */

const esquema = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre: así lo van a buscar en el sitio.'),
  slug: z
    .string()
    .trim()
    .min(1, 'El slug identifica el punto en el sitio.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones simples.'),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      'Ese correo no tiene forma de correo.'
    ),
  mapsUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^https?:\/\//i.test(value),
      'Pega el enlace completo, empezando por https://'
    ),
});

export function validar(form: FormState): ResultadoValidacion<SeccionId> {
  const errores = erroresDeZod(esquema.safeParse(form));

  /* Un día abierto sin horas, o que cierra antes de abrir, no se puede guardar:
     el sitio lo pintaría al revés. */
  for (const dia of DIAS) {
    const valor = form.hours[dia];
    if (!valor.abierto) continue;
    if (!valor.open || !valor.close) {
      errores.hours = `Falta la hora de ${!valor.open ? 'apertura' : 'cierre'} del ${ETIQUETAS_DIA[dia].toLowerCase()}.`;
      break;
    }
    if (valor.close <= valor.open) {
      errores.hours = `El ${ETIQUETAS_DIA[dia].toLowerCase()} cierra antes de abrir. Revisa las horas.`;
      break;
    }
  }

  const primerCampo = Object.keys(errores)[0];
  return {
    errores,
    primeraSeccion: primerCampo ? seccionDeCampo(primerCampo) : undefined,
  };
}
