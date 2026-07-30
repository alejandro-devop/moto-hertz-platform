import type { MotorcycleCondition } from '@/lib/graphql/motorcycles';

export type SeccionId = 'identidad' | 'precio' | 'papeles' | 'tecnica' | 'fotos' | 'sede';

export interface Seccion {
  id: SeccionId;
  label: string;
  /** Qué se contesta en esta sección, en una línea. */
  hint: string;
  /** Campos del formulario que pertenecen a la sección, para ubicar errores. */
  campos: string[];
}

/**
 * Los 41 campos de una moto agrupados como se piensan, no como están en la
 * tabla. Un campo se busca por la sección donde uno lo esperaría.
 */
export const SECCIONES: Seccion[] = [
  {
    id: 'identidad',
    label: 'Identidad',
    hint: 'Qué moto es y cómo se llama en el sitio.',
    campos: [
      'name',
      'slug',
      'brand',
      'condition',
      'year',
      'category',
      'mileageKm',
      'description',
      'fullDescription',
    ],
  },
  {
    id: 'precio',
    label: 'Precio',
    hint: 'Cuánto vale y si está a la venta en el sitio.',
    campos: ['price', 'currency', 'available', 'featured'],
  },
  {
    id: 'papeles',
    label: 'Papeles',
    hint: 'SOAT, tecnomecánica y procedencia. Solo para motos usadas.',
    campos: [
      'registrationCity',
      'soatExpiresAt',
      'soatNote',
      'technicalInspectionExpiresAt',
      'technicalInspectionNote',
      'registrationCostNote',
      'transferIncluded',
      'singleOwner',
      'provenanceWarranty',
    ],
  },
  {
    id: 'tecnica',
    label: 'Ficha técnica',
    hint: 'Motor, medidas y equipamiento.',
    campos: [
      'engineType',
      'engineDisplacement',
      'enginePower',
      'engineTorque',
      'specsWeight',
      'specsSeatHeight',
      'specsFuelCapacity',
      'specsTransmission',
      'features',
      'colors',
    ],
  },
  {
    id: 'fotos',
    label: 'Fotos',
    hint: 'La portada es la que sale en la lista y en el catálogo.',
    campos: ['imagesMain', 'imagesGallery'],
  },
  {
    id: 'sede',
    label: 'Sede',
    hint: 'Dónde está la moto y cómo se puede pagar.',
    campos: [
      'locationName',
      'locationAddress',
      'locationCity',
      'acceptsTradeIn',
      'hasFinancing',
      'paymentMethods',
    ],
  },
];

/**
 * Una moto nueva no tiene kilometraje, matrícula ni SOAT: mostrar esos campos
 * invita a inventarlos, así que la sección de papeles desaparece.
 */
export function seccionesVisibles(condition: MotorcycleCondition): Seccion[] {
  if (condition === 'NEW') return SECCIONES.filter((seccion) => seccion.id !== 'papeles');
  return SECCIONES;
}

/** A qué sección pertenece un campo, para saltar al primer error. */
export function seccionDeCampo(campo: string): SeccionId | undefined {
  return SECCIONES.find((seccion) => seccion.campos.includes(campo))?.id;
}
