/**
 * Banners: documentos GraphQL y tipos, espejo del SDL de
 * `backend/src/graphql/modules/banner/banner.schema.ts`.
 *
 * A diferencia del resto de los dominios, `position` no se manda al crear ni
 * al editar: la fija el backend (un banner nuevo se agrega al final) y solo
 * cambia con `bannerReorder`.
 */

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  /** Si falta, el sitio usa `image` también en pantallas pequeñas. */
  imageMobile?: string | null;
  link?: string | null;
  linkLabel?: string | null;
  /** El orden del carrusel. Solo lo cambia `bannerReorder`. */
  position: number;
  active: boolean;
  /** `null` = ya vigente. */
  startsAt?: string | null;
  /** `null` = no vence nunca. */
  endsAt?: string | null;
  /** Con valor, el banner está en la papelera. */
  deletedAt?: string | null;
}

/** Lo que viaja al guardar. `null` explícito en las fechas las borra. */
export interface BannerFormInput {
  title: string;
  subtitle?: string;
  image: string;
  imageMobile?: string;
  link?: string;
  linkLabel?: string;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

const BANNER_FIELDS = /* GraphQL */ `
  id
  title
  subtitle
  image
  imageMobile
  link
  linkLabel
  position
  active
  startsAt
  endsAt
  deletedAt
`;

export const BANNERS_QUERY = /* GraphQL */ `
  query Banners($page: Int, $limit: Int, $trashed: Boolean) {
    banners(page: $page, limit: $limit, trashed: $trashed) {
      total
      page
      limit
      banners {
        ${BANNER_FIELDS}
      }
    }
  }
`;

export const BANNER_ADD_MUTATION = /* GraphQL */ `
  mutation BannerAdd($input: BannerInput!) {
    bannerAdd(input: $input) {
      ${BANNER_FIELDS}
    }
  }
`;

export const BANNER_EDIT_MUTATION = /* GraphQL */ `
  mutation BannerEdit($input: BannerEditInput!) {
    bannerEdit(input: $input) {
      ${BANNER_FIELDS}
    }
  }
`;

/** Manda a la papelera; se puede restaurar. */
export const BANNER_REMOVE_MUTATION = /* GraphQL */ `
  mutation BannerRemove($id: ID!) {
    bannerRemove(id: $id)
  }
`;

export const BANNER_RESTORE_MUTATION = /* GraphQL */ `
  mutation BannerRestore($id: ID!) {
    bannerRestore(id: $id) {
      id
      deletedAt
    }
  }
`;

/** Definitivo. Solo desde la papelera. */
export const BANNER_PURGE_MUTATION = /* GraphQL */ `
  mutation BannerPurge($id: ID!) {
    bannerPurge(id: $id)
  }
`;

/** El orden completo, de arriba a abajo. */
export const BANNER_REORDER_MUTATION = /* GraphQL */ `
  mutation BannerReorder($ids: [ID!]!) {
    bannerReorder(ids: $ids) {
      ${BANNER_FIELDS}
    }
  }
`;

export interface BannersQueryResult {
  banners: {
    total: number;
    page: number;
    limit: number;
    banners: Banner[];
  };
}
