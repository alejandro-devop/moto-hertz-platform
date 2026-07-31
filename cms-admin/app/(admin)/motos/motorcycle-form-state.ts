import { z } from 'zod';
import { groupDigits, onlyDigits, slugify, toDateInput } from '@/lib/format';
import {
  erroresDeZod,
  listaDesdeTexto,
  textoDesdeLista,
  textoOpcional,
} from '@/lib/form-state';
import type {
  Motorcycle,
  MotorcycleCondition,
  MotorcycleFormInput,
} from '@/lib/graphql/motorcycles';
import type { ResultadoValidacion } from '@/lib/use-ficha-state';
import { seccionDeCampo, type SeccionId } from './form-sections';

/**
 * El formulario es plano aunque el tipo `Motorcycle` sea anidado: así cada
 * campo tiene una sola fuente de verdad y el estado sucio se calcula de un
 * `!==`. La forma anidada se rearma al enviar.
 */
export interface FormState {
  slug: string;
  /** `true` cuando alguien editó el slug a mano: deja de derivarse del nombre. */
  slugManual: boolean;
  name: string;
  category: string;
  brand: string;
  condition: MotorcycleCondition;
  year: string;
  mileageKm: string;
  /** Se guarda agrupado («8.900.000») y se envía en dígitos. */
  price: string;
  currency: string;
  description: string;
  fullDescription: string;
  engineType: string;
  engineDisplacement: string;
  enginePower: string;
  engineTorque: string;
  features: string;
  colors: string;
  imagesMain: string;
  imagesGallery: string[];
  specsWeight: string;
  specsSeatHeight: string;
  specsFuelCapacity: string;
  specsTransmission: string;
  registrationCity: string;
  soatExpiresAt: string;
  soatNote: string;
  technicalInspectionExpiresAt: string;
  technicalInspectionNote: string;
  registrationCostNote: string;
  transferIncluded: boolean;
  singleOwner: boolean;
  provenanceWarranty: boolean;
  acceptsTradeIn: boolean;
  hasFinancing: boolean;
  paymentMethods: string;
  locationName: string;
  locationAddress: string;
  locationCity: string;
  available: boolean;
  featured: boolean;
}

export const EMPTY_FORM: FormState = {
  slug: '',
  slugManual: false,
  name: '',
  category: '',
  brand: '',
  condition: 'USED',
  year: '',
  mileageKm: '',
  price: '',
  currency: 'COP',
  description: '',
  fullDescription: '',
  engineType: '',
  engineDisplacement: '',
  enginePower: '',
  engineTorque: '',
  features: '',
  colors: '',
  imagesMain: '',
  imagesGallery: [],
  specsWeight: '',
  specsSeatHeight: '',
  specsFuelCapacity: '',
  specsTransmission: '',
  registrationCity: '',
  soatExpiresAt: '',
  soatNote: '',
  technicalInspectionExpiresAt: '',
  technicalInspectionNote: '',
  registrationCostNote: '',
  transferIncluded: false,
  singleOwner: false,
  provenanceWarranty: false,
  acceptsTradeIn: false,
  hasFinancing: false,
  paymentMethods: '',
  locationName: '',
  locationAddress: '',
  locationCity: '',
  available: true,
  featured: false,
};

export function motorcycleToForm(motorcycle: Motorcycle): FormState {
  return {
    slug: motorcycle.slug,
    /* Una moto que ya existe conserva su slug: cambiarlo rompe su URL. */
    slugManual: true,
    name: motorcycle.name,
    category: motorcycle.category ?? '',
    brand: motorcycle.brand ?? '',
    condition: motorcycle.condition ?? 'USED',
    year: motorcycle.year?.toString() ?? '',
    mileageKm: motorcycle.mileageKm?.toString() ?? '',
    price: groupDigits(motorcycle.price ?? ''),
    currency: motorcycle.currency || 'COP',
    description: motorcycle.description ?? '',
    fullDescription: motorcycle.fullDescription ?? '',
    engineType: motorcycle.engine?.type ?? '',
    engineDisplacement: motorcycle.engine?.displacement ?? '',
    enginePower: motorcycle.engine?.power ?? '',
    engineTorque: motorcycle.engine?.torque ?? '',
    features: textoDesdeLista(motorcycle.features),
    colors: textoDesdeLista(motorcycle.colors),
    imagesMain: motorcycle.images?.main ?? '',
    imagesGallery: [...(motorcycle.images?.gallery ?? [])],
    specsWeight: motorcycle.specs?.weight ?? '',
    specsSeatHeight: motorcycle.specs?.seatHeight ?? '',
    specsFuelCapacity: motorcycle.specs?.fuelCapacity ?? '',
    specsTransmission: motorcycle.specs?.transmission ?? '',
    registrationCity: motorcycle.paperwork?.registrationCity ?? '',
    soatExpiresAt: toDateInput(motorcycle.paperwork?.soatExpiresAt),
    soatNote: motorcycle.paperwork?.soatNote ?? '',
    technicalInspectionExpiresAt: toDateInput(
      motorcycle.paperwork?.technicalInspectionExpiresAt
    ),
    technicalInspectionNote: motorcycle.paperwork?.technicalInspectionNote ?? '',
    registrationCostNote: motorcycle.paperwork?.registrationCostNote ?? '',
    transferIncluded: motorcycle.paperwork?.transferIncluded ?? false,
    singleOwner: motorcycle.paperwork?.singleOwner ?? false,
    provenanceWarranty: motorcycle.paperwork?.provenanceWarranty ?? false,
    acceptsTradeIn: motorcycle.commercial?.acceptsTradeIn ?? false,
    hasFinancing: motorcycle.commercial?.hasFinancing ?? false,
    paymentMethods: textoDesdeLista(motorcycle.commercial?.paymentMethods),
    locationName: motorcycle.location?.name ?? '',
    locationAddress: motorcycle.location?.address ?? '',
    locationCity: motorcycle.location?.city ?? '',
    available: motorcycle.available,
    featured: motorcycle.featured,
  };
}

/** El slug se deriva del nombre y el año mientras nadie lo haya tocado. */
export function slugSugerido(form: FormState): string {
  return slugify(form.name, form.year);
}

export function formToInput(form: FormState): MotorcycleFormInput {
  const trim = textoOpcional;
  const main = form.imagesMain.trim();

  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    category: trim(form.category),
    brand: trim(form.brand),
    condition: form.condition,
    year: form.year ? Number(form.year) : undefined,
    /* El kilometraje solo tiene sentido en una moto usada. */
    mileageKm:
      form.condition === 'USED' && form.mileageKm ? Number(form.mileageKm) : undefined,
    price: onlyDigits(form.price) || undefined,
    currency: trim(form.currency),
    description: trim(form.description),
    fullDescription: trim(form.fullDescription),
    engine: {
      type: trim(form.engineType),
      displacement: trim(form.engineDisplacement),
      power: trim(form.enginePower),
      torque: trim(form.engineTorque),
    },
    features: listaDesdeTexto(form.features),
    colors: listaDesdeTexto(form.colors),
    /* `images.main` es obligatorio en el backend: sin portada no se envía nada. */
    images: main ? { main, gallery: form.imagesGallery.filter(Boolean) } : undefined,
    specs: {
      weight: trim(form.specsWeight),
      seatHeight: trim(form.specsSeatHeight),
      fuelCapacity: trim(form.specsFuelCapacity),
      transmission: trim(form.specsTransmission),
    },
    /* Los papeles son de las usadas; en una nueva no se manda nada. */
    paperwork:
      form.condition === 'USED'
        ? {
            registrationCity: trim(form.registrationCity),
            soatExpiresAt: trim(form.soatExpiresAt),
            soatNote: trim(form.soatNote),
            technicalInspectionExpiresAt: trim(form.technicalInspectionExpiresAt),
            technicalInspectionNote: trim(form.technicalInspectionNote),
            registrationCostNote: trim(form.registrationCostNote),
            transferIncluded: form.transferIncluded,
            singleOwner: form.singleOwner,
            provenanceWarranty: form.provenanceWarranty,
          }
        : undefined,
    commercial: {
      acceptsTradeIn: form.acceptsTradeIn,
      hasFinancing: form.hasFinancing,
      paymentMethods: listaDesdeTexto(form.paymentMethods),
    },
    location: {
      name: trim(form.locationName),
      address: trim(form.locationAddress),
      city: trim(form.locationCity),
    },
    available: form.available,
    featured: form.featured,
  };
}

/* -------------------------------------------------------------------------- *
 * Validación
 * -------------------------------------------------------------------------- */

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ANIO_ACTUAL = new Date().getFullYear();

const entero = (etiqueta: string, max: number) =>
  z
    .string()
    .refine((value) => value === '' || /^\d+$/.test(value), `${etiqueta} va en números enteros.`)
    .refine(
      (value) => value === '' || Number(value) <= max,
      `${etiqueta} no puede pasar de ${max}.`
    );

const fecha = (etiqueta: string) =>
  z
    .string()
    .refine(
      (value) => value === '' || FECHA.test(value),
      `${etiqueta} va en formato año-mes-día.`
    );

const esquema = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre: marca, modelo y año.'),
  slug: z
    .string()
    .trim()
    .min(1, 'El slug arma la URL de la moto en el sitio.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones simples.'),
  year: entero('El año', ANIO_ACTUAL + 2).refine(
    (value) => value === '' || Number(value) >= 1900,
    'El año tiene que ser posterior a 1900.'
  ),
  mileageKm: entero('El kilometraje', 999_999),
  soatExpiresAt: fecha('La fecha del SOAT'),
  technicalInspectionExpiresAt: fecha('La fecha de la tecnomecánica'),
});

export function validar(form: FormState): ResultadoValidacion<SeccionId> {
  const errores = erroresDeZod(esquema.safeParse(form));

  /* La galería sin portada no se puede guardar: el backend exige `main`. */
  if (!form.imagesMain.trim() && form.imagesGallery.length > 0) {
    errores.imagesMain = 'Elige cuál de las fotos es la portada.';
  }

  const primerCampo = Object.keys(errores)[0];
  return {
    errores,
    primeraSeccion: primerCampo ? seccionDeCampo(primerCampo) : undefined,
  };
}
