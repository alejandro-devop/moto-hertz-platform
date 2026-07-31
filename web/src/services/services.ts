import type { Service, ServiceCollection } from "@/types/service";
import { httpClient } from "@/utils";

/**
 * Servicios desde el `backend` propio (Fase 3 del plan CMS). La query es
 * pública, igual que la de motos y la de puntos de atención: el sitio no tiene
 * sesión.
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
`;

const SERVICES_QUERY = /* GraphQL */ `
  query Services($page: Int, $limit: Int) {
    services(page: $page, limit: $limit) {
      total
      page
      limit
      services {
        ${SERVICE_FIELDS}
      }
    }
  }
`;

const SERVICE_BY_SLUG_QUERY = /* GraphQL */ `
  query Service($slug: String!) {
    service(slug: $slug) {
      ${SERVICE_FIELDS}
    }
  }
`;

export async function getServices(
  variables: { page?: number; limit?: number } = {},
): Promise<ServiceCollection> {
  const data = await graphqlRequest<{ services: ServiceCollection }>(
    SERVICES_QUERY,
    { page: 1, limit: 100, ...variables },
  );
  return data.services;
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const data = await graphqlRequest<{ service: Service | null }>(
    SERVICE_BY_SLUG_QUERY,
    { slug },
  );
  return data.service;
}
