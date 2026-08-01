import type { Motorcycle, MotorcycleCollection } from "@/types/motorcycle";
import { httpClient } from "@/utils";

/**
 * Cliente GraphQL contra el `backend` propio (Fase 5 — integración end-to-end).
 * Las queries de catálogo son públicas (sin auth), consistente con
 * `backend/src/graphql/modules/motorcycle/motorcycle.resolvers.ts`.
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

const MOTORCYCLE_FIELDS = /* GraphQL */ `
  id
  slug
  name
  category
  year
  price
  currency
  description
  fullDescription
  engine {
    type
    displacement
    power
    torque
  }
  features
  colors
  images {
    main
    gallery
  }
  specs {
    weight
    seatHeight
    fuelCapacity
    transmission
  }
  available
  featured
`;

const MOTORCYCLES_QUERY = /* GraphQL */ `
  query Motorcycles($page: Int, $limit: Int, $featured: Boolean) {
    motorcycles(page: $page, limit: $limit, featured: $featured) {
      total
      page
      limit
      motorcycles {
        ${MOTORCYCLE_FIELDS}
      }
    }
  }
`;

const MOTORCYCLE_BY_SLUG_QUERY = /* GraphQL */ `
  query Motorcycle($slug: String!) {
    motorcycle(slug: $slug) {
      ${MOTORCYCLE_FIELDS}
    }
  }
`;

export async function getMotorcycles(
  variables: { page?: number; limit?: number; featured?: boolean } = {},
): Promise<MotorcycleCollection> {
  const data = await graphqlRequest<{ motorcycles: MotorcycleCollection }>(
    MOTORCYCLES_QUERY,
    { page: 1, limit: 100, ...variables },
  );
  return data.motorcycles;
}

export async function getMotorcycleBySlug(
  slug: string,
): Promise<Motorcycle | null> {
  const data = await graphqlRequest<{ motorcycle: Motorcycle | null }>(
    MOTORCYCLE_BY_SLUG_QUERY,
    { slug },
  );
  return data.motorcycle;
}

/** Slug de categoría derivado del nombre, igual criterio que usaba el mock (`categories[].id`). */
export function categorySlug(categoryName: string): string {
  return categoryName.toLowerCase().replace(/\s+/g, "-");
}
