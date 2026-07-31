/**
 * Puntos de atención: documentos GraphQL y tipos, espejo del SDL de
 * `backend/src/graphql/modules/service-point/service-point.schema.ts`.
 */

/** Catálogo cerrado; las etiquetas viven en `puntos-de-atencion/filters.ts`. */
export type ServicePointType = 'SEDE' | 'CONCESIONARIO' | 'DISTRIBUIDOR';

export interface ServicePointAddress {
  street?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

/** `lat`/`lng` las deriva el backend del enlace: aquí solo se leen. */
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
  /** Con valor, el punto está en la papelera. */
  deletedAt?: string | null;
}

export interface ServicePointFormInput {
  slug: string;
  name: string;
  type: ServicePointType;
  address?: ServicePointAddress;
  phone?: string;
  whatsapp?: string;
  email?: string;
  /** Solo el enlace: el backend saca las coordenadas de ahí. */
  location?: { mapsUrl?: string };
  hours?: ServicePointHours;
}

const SERVICE_POINT_FIELDS = /* GraphQL */ `
  id
  slug
  name
  type
  address {
    street
    neighborhood
    city
    state
  }
  phone
  whatsapp
  email
  location {
    mapsUrl
    lat
    lng
  }
  hours {
    monday {
      open
      close
    }
    tuesday {
      open
      close
    }
    wednesday {
      open
      close
    }
    thursday {
      open
      close
    }
    friday {
      open
      close
    }
    saturday {
      open
      close
    }
    sunday {
      open
      close
    }
  }
  deletedAt
`;

export const SERVICE_POINTS_QUERY = /* GraphQL */ `
  query ServicePoints($page: Int, $limit: Int, $trashed: Boolean) {
    servicePoints(page: $page, limit: $limit, trashed: $trashed) {
      total
      page
      limit
      servicePoints {
        ${SERVICE_POINT_FIELDS}
      }
    }
  }
`;

export const SERVICE_POINT_ADD_MUTATION = /* GraphQL */ `
  mutation ServicePointAdd($input: ServicePointInput!) {
    servicePointAdd(input: $input) {
      ${SERVICE_POINT_FIELDS}
    }
  }
`;

export const SERVICE_POINT_EDIT_MUTATION = /* GraphQL */ `
  mutation ServicePointEdit($input: ServicePointEditInput!) {
    servicePointEdit(input: $input) {
      ${SERVICE_POINT_FIELDS}
    }
  }
`;

/** Manda a la papelera; se puede restaurar. */
export const SERVICE_POINT_REMOVE_MUTATION = /* GraphQL */ `
  mutation ServicePointRemove($id: ID!) {
    servicePointRemove(id: $id)
  }
`;

export const SERVICE_POINT_RESTORE_MUTATION = /* GraphQL */ `
  mutation ServicePointRestore($id: ID!) {
    servicePointRestore(id: $id) {
      id
      deletedAt
    }
  }
`;

/** Definitivo. Solo desde la papelera. */
export const SERVICE_POINT_PURGE_MUTATION = /* GraphQL */ `
  mutation ServicePointPurge($id: ID!) {
    servicePointPurge(id: $id)
  }
`;

export interface ServicePointsQueryResult {
  servicePoints: {
    total: number;
    page: number;
    limit: number;
    servicePoints: ServicePoint[];
  };
}
