export type MotorcycleCondition = 'NEW' | 'USED';

export interface MotorcycleEngine {
  [key: string]: string | undefined;
  type?: string;
  displacement?: string;
  power?: string;
  torque?: string;
}

export interface MotorcycleImages {
  main: string;
  gallery: string[];
}

export interface MotorcycleSpecs {
  [key: string]: string | undefined;
  weight?: string;
  seatHeight?: string;
  fuelCapacity?: string;
  transmission?: string;
}

/**
 * Documentación y procedencia. En el sitio actual esto vive como texto libre
 * dentro de la descripción ("Matricula: SABANETA", "Soat: 23 DE DICIEMBRE DE
 * 2026"). Cada trámite tiene fecha *y* nota porque en las motos nuevas el dato
 * no es una vigencia sino una condición ("NO INCLUIDO EN EL PRECIO PUBLICADO").
 */
export interface MotorcyclePaperwork {
  /** Ciudad de matrícula, ej. "SABANETA". */
  registrationCity?: string;
  /** Vigencia del SOAT en formato ISO `YYYY-MM-DD`. */
  soatExpiresAt?: string;
  /** Texto alternativo cuando no hay fecha, ej. "NO INCLUIDO EN EL PRECIO". */
  soatNote?: string;
  /** Vigencia de la tecnomecánica en formato ISO `YYYY-MM-DD`. */
  technicalInspectionExpiresAt?: string;
  technicalInspectionNote?: string;
  /** Gastos de matrícula, ej. "NO INCLUIDO EN EL PRECIO PUBLICADO". */
  registrationCostNote?: string;
  /** El traspaso está incluido en el precio publicado. */
  transferIncluded?: boolean;
  /** "Único dueño". */
  singleOwner?: boolean;
  /** "Garantía de procedencia 100%". */
  provenanceWarranty?: boolean;
}

/** Condiciones comerciales que el sitio actual repite en cada publicación. */
export interface MotorcycleCommercial {
  /** "Recibimos su motocicleta usada en parte de pago". */
  acceptsTradeIn?: boolean;
  /** "Tenemos financiamiento". */
  hasFinancing?: boolean;
  /** Ej. ["Efectivo", "Tarjeta de crédito", "Transferencia bancaria"]. */
  paymentMethods?: string[];
}

/**
 * Sede donde está físicamente la moto — en el sitio actual cambia según la
 * publicación (San Diego para usadas, El Retiro para nuevas). Es texto libre
 * porque el dominio `service-point` todavía no tiene capa GraphQL; cuando la
 * tenga, esto puede pasar a ser una referencia a `service_points`.
 */
export interface MotorcycleLocation {
  [key: string]: string | undefined;
  /** Nombre de la sede, ej. "San Diego". */
  name?: string;
  address?: string;
  city?: string;
}

export interface Motorcycle {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
  brand?: string | null;
  condition: MotorcycleCondition;
  year?: number | null;
  mileageKm?: number | null;
  price?: string | null;
  currency: string;
  description?: string | null;
  fullDescription?: string | null;
  engine?: MotorcycleEngine | null;
  features: string[];
  colors: string[];
  images?: MotorcycleImages | null;
  specs?: MotorcycleSpecs | null;
  paperwork?: MotorcyclePaperwork | null;
  commercial?: MotorcycleCommercial | null;
  location?: MotorcycleLocation | null;
  available: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MotorcycleCollection {
  motorcycles: Motorcycle[];
  page: number;
  limit: number;
  total: number;
}

export interface ListMotorcyclesOptions {
  category?: string;
  brand?: string;
  condition?: MotorcycleCondition;
  featured?: boolean;
  available?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateMotorcycleInput {
  slug: string;
  name: string;
  category?: string;
  brand?: string;
  condition?: MotorcycleCondition;
  year?: number;
  mileageKm?: number;
  price?: string;
  currency?: string;
  description?: string;
  fullDescription?: string;
  engine?: MotorcycleEngine;
  features?: string[];
  colors?: string[];
  images?: MotorcycleImages;
  specs?: MotorcycleSpecs;
  paperwork?: MotorcyclePaperwork;
  commercial?: MotorcycleCommercial;
  location?: MotorcycleLocation;
  available?: boolean;
  featured?: boolean;
}

export interface UpdateMotorcycleInput extends Partial<CreateMotorcycleInput> {}
