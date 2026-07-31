/** Espejo del SDL de `backend/src/graphql/modules/service-point/`. */

export type ServicePointType = "SEDE" | "CONCESIONARIO" | "DISTRIBUIDOR";

export interface ServicePointAddress {
  street?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

/**
 * `lat`/`lng` llegan solo si el enlace de Google Maps las traía. Sin ellas no
 * hay mapa incrustado, pero el enlace sigue sirviendo para «Cómo llegar».
 */
export interface ServicePointLocation {
  mapsUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface ServicePointDayHours {
  open: string;
  close: string;
}

/** Un día en `null` está cerrado. */
export interface ServicePointHours {
  monday?: ServicePointDayHours | null;
  tuesday?: ServicePointDayHours | null;
  wednesday?: ServicePointDayHours | null;
  thursday?: ServicePointDayHours | null;
  friday?: ServicePointDayHours | null;
  saturday?: ServicePointDayHours | null;
  sunday?: ServicePointDayHours | null;
}

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
}

export interface ServicePointCollection {
  total: number;
  page: number;
  limit: number;
  servicePoints: ServicePoint[];
}
