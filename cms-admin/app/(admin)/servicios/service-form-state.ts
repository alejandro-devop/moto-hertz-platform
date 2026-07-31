import { z } from 'zod';
import { onlyDigits, slugify } from '@/lib/format';
import { erroresDeZod, textoOpcional } from '@/lib/form-state';
import type { ResultadoValidacion } from '@/lib/use-ficha-state';
import type { Service, ServiceFormInput, ServicePricingMode } from '@/lib/graphql/services';
import { seccionDeCampo, type SeccionId } from './form-sections';

/**
 * El formulario es **plano** aunque `Service` sea anidado: `pricing` se
 * desarma en tres campos (`pricingMode`, `pricingAmount`, `pricingNote`) para
 * que cada uno tenga su propio error y el «sin guardar» se calcule con una
 * comparación. Las listas se quedan como arreglos, que es lo que edita
 * `ListaEditable` y lo que el backend recibe.
 */
export interface FormState {
  slug: string;
  /** `true` cuando alguien editó el slug a mano: deja de derivarse del nombre. */
  slugManual: boolean;
  name: string;
  category: string;
  icon: string;
  image: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  benefits: string[];
  pricingMode: ServicePricingMode;
  /** Con separadores de miles mientras se escribe: `"150.000"`. */
  pricingAmount: string;
  pricingNote: string;
  duration: string;
  featured: boolean;
}

export const EMPTY_FORM: FormState = {
  slug: '',
  slugManual: false,
  name: '',
  category: '',
  icon: 'wrench',
  image: '',
  shortDescription: '',
  fullDescription: '',
  features: [],
  benefits: [],
  /* Un servicio nuevo arranca «a convenir»: es lo que no obliga a inventarse
     un número para poder guardar. */
  pricingMode: 'A_CONVENIR',
  pricingAmount: '',
  pricingNote: '',
  duration: '',
  featured: false,
};

export function serviceToForm(servicio: Service): FormState {
  const monto = servicio.pricing?.amount;

  return {
    slug: servicio.slug,
    /* Un servicio que ya existe conserva su slug: cambiarlo rompe su enlace. */
    slugManual: true,
    name: servicio.name,
    category: servicio.category ?? '',
    icon: servicio.icon ?? 'wrench',
    image: servicio.image ?? '',
    shortDescription: servicio.shortDescription ?? '',
    fullDescription: servicio.fullDescription ?? '',
    features: [...servicio.features],
    benefits: [...servicio.benefits],
    /* Sin precio guardado se lee «a convenir»: la única equivalencia que
       existe, y está escrita igual en las tres capas. */
    pricingMode: servicio.pricing?.mode ?? 'A_CONVENIR',
    pricingAmount: monto !== null && monto !== undefined ? new Intl.NumberFormat('es-CO').format(monto) : '',
    pricingNote: servicio.pricing?.note ?? '',
    duration: servicio.duration ?? '',
    featured: servicio.featured,
  };
}

/** El slug se deriva del nombre mientras nadie lo haya tocado. */
export function slugSugerido(form: FormState): string {
  return slugify(form.name);
}

export function formToInput(form: FormState): ServiceFormInput {
  const trim = textoOpcional;
  const monto = Number(onlyDigits(form.pricingAmount));

  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    category: trim(form.category),
    shortDescription: trim(form.shortDescription),
    fullDescription: trim(form.fullDescription),
    icon: trim(form.icon),
    /* Los renglones en blanco no viajan: el backend los descartaría igual. */
    features: form.features.map((item) => item.trim()).filter(Boolean),
    benefits: form.benefits.map((item) => item.trim()).filter(Boolean),
    pricing: {
      mode: form.pricingMode,
      /* «A convenir» no lleva monto, aunque haya quedado escrito uno. */
      amount: form.pricingMode === 'A_CONVENIR' || !monto ? undefined : monto,
      note: trim(form.pricingNote),
    },
    duration: trim(form.duration),
    featured: form.featured,
    image: trim(form.image),
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
    .min(1, 'El slug identifica el servicio en el sitio.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones simples.'),
  shortDescription: z
    .string()
    .trim()
    .max(500, 'La descripción corta es la línea de la tarjeta: máximo 500 caracteres.'),
  fullDescription: z.string().trim().max(5000, 'Máximo 5.000 caracteres.'),
  pricingNote: z.string().trim().max(120, 'La nota es una línea corta: máximo 120 caracteres.'),
});

export function validar(form: FormState): ResultadoValidacion<SeccionId> {
  const errores = erroresDeZod(esquema.safeParse(form));

  /* «Desde» y «fijo» exigen monto; sin él no hay nada que publicar. Es la
     misma regla del validador del backend, dicha en el idioma de la ficha. */
  if (form.pricingMode !== 'A_CONVENIR' && !Number(onlyDigits(form.pricingAmount))) {
    errores.pricingAmount =
      'Escribe el monto, o cambia la modalidad a «A convenir» si todavía no hay precio.';
  }

  /* Un renglón vacío en medio de la lista no se guarda, pero avisarlo evita
     que alguien crea que se perdió lo que escribió. */
  for (const [campo, etiqueta] of [
    ['features', 'característica'],
    ['benefits', 'beneficio'],
  ] as const) {
    const lista = form[campo];
    if (lista.length > 0 && lista.every((item) => !item.trim())) {
      errores[campo] = `Escribe la ${etiqueta} o quita el renglón.`;
    }
  }

  const primerCampo = Object.keys(errores)[0];
  return {
    errores,
    primeraSeccion: primerCampo ? seccionDeCampo(primerCampo) : undefined,
  };
}
