/**
 * Progreso de los recorridos guiados: documentos GraphQL y tipos, espejo del
 * SDL de `backend/src/graphql/modules/tour/tour.schema.ts`.
 *
 * A diferencia del resto de los dominios, **la query también exige sesión**:
 * el progreso es un dato por usuario y el sitio público no lo consume.
 */

export type TourStatus = 'completed' | 'skipped';

export interface TourProgress {
  tourKey: string;
  version: number;
  status: TourStatus;
  seenAt: string;
}

export const TOUR_PROGRESS_QUERY = /* GraphQL */ `
  query TourProgress {
    tourProgress {
      tourKey
      version
      status
      seenAt
    }
  }
`;

export const TOUR_SEEN_MUTATION = /* GraphQL */ `
  mutation TourSeen($key: String!, $version: Int!, $status: TourStatus!) {
    tourSeen(key: $key, version: $version, status: $status) {
      tourKey
      version
      status
      seenAt
    }
  }
`;

/** Sin `key`, reinicia todos los recorridos del usuario. Devuelve cuántos borró. */
export const TOUR_RESET_MUTATION = /* GraphQL */ `
  mutation TourReset($key: String) {
    tourReset(key: $key)
  }
`;

export interface TourProgressQueryResult {
  tourProgress: TourProgress[];
}

export interface TourSeenResult {
  tourSeen: TourProgress;
}

export interface TourResetResult {
  tourReset: number;
}
