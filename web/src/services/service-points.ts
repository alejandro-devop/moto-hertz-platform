import type {
  ServicePoint,
  ServicePointCollection,
} from "@/types/service-point";
import { httpClient } from "@/utils";

/**
 * Puntos de atención desde el `backend` propio (Fase 2 del plan CMS). La query
 * es pública, igual que la de motos: el sitio no tiene sesión.
 */
function getBackendGraphQLUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL ||
    "http://localhost:8080/graphql"
  );
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await httpClient.post<GraphQLResponse<T>>(
    getBackendGraphQLUrl(),
    { query, variables },
  );

  if (response.errors?.length) {
    throw new Error(response.errors.map((e) => e.message).join(", "));
  }

  return response.data as T;
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
`;

const SERVICE_POINTS_QUERY = /* GraphQL */ `
  query ServicePoints($page: Int, $limit: Int) {
    servicePoints(page: $page, limit: $limit) {
      total
      page
      limit
      servicePoints {
        ${SERVICE_POINT_FIELDS}
      }
    }
  }
`;

const SERVICE_POINT_BY_SLUG_QUERY = /* GraphQL */ `
  query ServicePoint($slug: String!) {
    servicePoint(slug: $slug) {
      ${SERVICE_POINT_FIELDS}
    }
  }
`;

export async function getServicePoints(
  variables: { page?: number; limit?: number } = {},
): Promise<ServicePointCollection> {
  const data = await graphqlRequest<{ servicePoints: ServicePointCollection }>(
    SERVICE_POINTS_QUERY,
    { page: 1, limit: 100, ...variables },
  );
  return data.servicePoints;
}

export async function getServicePointBySlug(
  slug: string,
): Promise<ServicePoint | null> {
  const data = await graphqlRequest<{ servicePoint: ServicePoint | null }>(
    SERVICE_POINT_BY_SLUG_QUERY,
    { slug },
  );
  return data.servicePoint;
}
