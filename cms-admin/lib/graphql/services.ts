/**
 * Servicios: documentos GraphQL y tipos, espejo del SDL de
 * `backend/src/graphql/modules/service/service.schema.ts`.
 */

/**
 * Las tres modalidades de precio. `DESDE` y `FIJO` llevan monto; `A_CONVENIR`
 * no. Un `pricing` en `null` se lee como `A_CONVENIR` (ver
 * `lib/service-pricing.ts`).
 */
export type ServicePricingMode = 'DESDE' | 'FIJO' | 'A_CONVENIR';

export interface ServicePricing {
  mode: ServicePricingMode;
  /** En pesos. `null` cuando la modalidad es `A_CONVENIR`. */
  amount?: number | null;
  currency: string;
  /** «cada 5.000 km», «una vez al año». Texto libre. */
  note?: string | null;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  /** Texto libre: no hay catálogo cerrado de categorías. */
  category?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  /** Nombre de un icono de lucide en kebab-case (ver `lib/service-icons.ts`). */
  icon?: string | null;
  /** Listas **ordenadas**: el orden se edita y el sitio lo respeta. */
  features: string[];
  benefits: string[];
  pricing?: ServicePricing | null;
  duration?: string | null;
  featured: boolean;
  image?: string | null;
  /** Con valor, el servicio está en la papelera. */
  deletedAt?: string | null;
}

/** Lo que viaja al guardar. La moneda no se manda: la fija el backend en COP. */
export interface ServiceFormInput {
  slug: string;
  name: string;
  category?: string;
  shortDescription?: string;
  fullDescription?: string;
  icon?: string;
  features: string[];
  benefits: string[];
  pricing: { mode: ServicePricingMode; amount?: number; note?: string };
  duration?: string;
  featured: boolean;
  image?: string;
}

const SERVICE_FIELDS = /* GraphQL */ `
  id
  slug
  name
  category
  shortDescription
  fullDescription
  icon
  features
  benefits
  pricing {
    mode
    amount
    currency
    note
  }
  duration
  featured
  image
  deletedAt
`;

export const SERVICES_QUERY = /* GraphQL */ `
  query Services($page: Int, $limit: Int, $trashed: Boolean) {
    services(page: $page, limit: $limit, trashed: $trashed) {
      total
      page
      limit
      services {
        ${SERVICE_FIELDS}
      }
    }
  }
`;

export const SERVICE_ADD_MUTATION = /* GraphQL */ `
  mutation ServiceAdd($input: ServiceInput!) {
    serviceAdd(input: $input) {
      ${SERVICE_FIELDS}
    }
  }
`;

export const SERVICE_EDIT_MUTATION = /* GraphQL */ `
  mutation ServiceEdit($input: ServiceEditInput!) {
    serviceEdit(input: $input) {
      ${SERVICE_FIELDS}
    }
  }
`;

/** Manda a la papelera; se puede restaurar. */
export const SERVICE_REMOVE_MUTATION = /* GraphQL */ `
  mutation ServiceRemove($id: ID!) {
    serviceRemove(id: $id)
  }
`;

export const SERVICE_RESTORE_MUTATION = /* GraphQL */ `
  mutation ServiceRestore($id: ID!) {
    serviceRestore(id: $id) {
      id
      deletedAt
    }
  }
`;

/** Definitivo. Solo desde la papelera. */
export const SERVICE_PURGE_MUTATION = /* GraphQL */ `
  mutation ServicePurge($id: ID!) {
    servicePurge(id: $id)
  }
`;

export interface ServicesQueryResult {
  services: {
    total: number;
    page: number;
    limit: number;
    services: Service[];
  };
}
