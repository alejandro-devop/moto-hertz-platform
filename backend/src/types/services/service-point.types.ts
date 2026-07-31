/**
 * Puntos de atención: las sedes propias, los concesionarios y los
 * distribuidores donde se atiende al público.
 *
 * Tres columnas de la tabla `service_points` **quedaron sin usar a propósito**
 * (`services`, `featured`, `image`): venían de la plantilla Yamaha y el usuario
 * las descartó en la Fase 2 del plan CMS. Siguen en la base para no migrar por
 * nada, pero no se exponen en GraphQL ni se editan en el panel.
 */

/**
 * Catálogo cerrado de tipos, derivado de lo que publica el sitio legacy
 * (motoshotwheels.com): dos sedes propias en Medellín, una sede de motos nuevas
 * Yamaha en El Retiro y un distribuidor aliado en Bogotá.
 *
 * **Para agregar un valor** (un taller, por ejemplo) hay que tocar cuatro
 * sitios y ninguno más: este tipo, `servicePointTypeSchema` en
 * `src/validators/schemas/service-point.schemas.ts`, el `enum ServicePointType`
 * del SDL, y `ETIQUETAS_TIPO` en
 * `cms-admin/app/(admin)/puntos-de-atencion/filters.ts` (el sitio público lee
 * la etiqueta del backend, así que no hay que tocarlo).
 */
export type ServicePointType = 'SEDE' | 'CONCESIONARIO' | 'DISTRIBUIDOR';

export const SERVICE_POINT_TYPES: ServicePointType[] = [
  'SEDE',
  'CONCESIONARIO',
  'DISTRIBUIDOR',
];

/**
 * La dirección, partida en lo que de verdad se escribe. Sin código postal ni
 * país: todos los puntos están en Colombia y nadie llena un código postal.
 * `city` es lo que agrupa la página pública.
 */
export interface ServicePointAddress {
  [key: string]: string | undefined;
  /** "Carrera 46 No 36-16". */
  street?: string;
  /** "San Diego", "Belén La Palma". */
  neighborhood?: string;
  /** "Medellín". */
  city?: string;
  /** "Antioquia". */
  state?: string;
}

/**
 * La ubicación se captura **pegando el enlace de Google Maps**, que es lo único
 * que alguien puede llenar sin ir a buscar coordenadas a mano.
 *
 * `lat`/`lng` no se escriben: los extrae el backend del propio enlace cuando
 * vienen en él (`@lat,lng`, `!3dlat!4dlng`, `q=lat,lng`). Si el enlace no las
 * trae —los `maps.app.goo.gl` acortados no las traen— se guarda solo `mapsUrl`
 * y el sitio ofrece «Cómo llegar» sin mapa incrustado.
 */
export interface ServicePointLocation {
  mapsUrl?: string;
  lat?: number;
  lng?: number;
}

/** Un tramo de atención en formato 24 h, `"09:15"`. */
export interface ServicePointDayHours {
  open: string;
  close: string;
}

/**
 * Horario semanal. **Un día que no está en el objeto está cerrado** — no hay
 * bandera `closed`, para que no existan dos formas de decir lo mismo.
 */
export interface ServicePointHours {
  monday?: ServicePointDayHours;
  tuesday?: ServicePointDayHours;
  wednesday?: ServicePointDayHours;
  thursday?: ServicePointDayHours;
  friday?: ServicePointDayHours;
  saturday?: ServicePointDayHours;
  sunday?: ServicePointDayHours;
}

export const WEEK_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

export interface ServicePoint {
  id: string;
  slug: string;
  name: string;
  type: ServicePointType;
  address?: ServicePointAddress | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  location?: ServicePointLocation | null;
  hours?: ServicePointHours | null;
  createdAt: Date;
  updatedAt: Date;
  /** Con valor, el punto está en la papelera y no sale en ningún listado. */
  deletedAt?: Date | null;
}

export interface ServicePointCollection {
  servicePoints: ServicePoint[];
  page: number;
  limit: number;
  total: number;
}

export interface ListServicePointsOptions {
  type?: ServicePointType;
  page?: number;
  limit?: number;
  /** `true` = solo la papelera. Por defecto, solo lo no borrado. */
  trashed?: boolean;
}

export interface CreateServicePointInput {
  slug: string;
  name: string;
  type: ServicePointType;
  address?: ServicePointAddress;
  phone?: string;
  whatsapp?: string;
  email?: string;
  location?: ServicePointLocation;
  hours?: ServicePointHours;
}

export interface UpdateServicePointInput extends Partial<CreateServicePointInput> {}
