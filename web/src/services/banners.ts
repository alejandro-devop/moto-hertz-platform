import type { Banner, BannerCollection } from "@/types/banner";
import { httpClient } from "@/utils";

/**
 * El carrusel de la portada, desde el `backend` propio (Fase 5 del plan CMS).
 * La query es pública, igual que motos, puntos de atención, servicios y
 * noticias: el sitio no tiene sesión, y por eso mismo el backend nunca
 * devuelve un banner inactivo ni fuera de vigencia (ver `backend/CLAUDE.md`,
 * sección `banner`). `web` no vuelve a filtrar nada de eso: ya viene filtrado
 * y en el orden en que hay que pintarlo.
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

const BANNER_FIELDS = /* GraphQL */ `
  id
  title
  subtitle
  image
  imageMobile
  link
  linkLabel
  position
`;

const BANNERS_QUERY = /* GraphQL */ `
  query Banners($page: Int, $limit: Int, $slot: BannerSlot) {
    banners(page: $page, limit: $limit, slot: $slot) {
      total
      page
      limit
      banners {
        ${BANNER_FIELDS}
      }
    }
  }
`;

/** Dónde aparece un banner. Espejo del enum `BannerSlot` del backend. */
export type BannerSlot = "HOME" | "SECUNDARIO";

export async function getBanners(
  variables: { page?: number; limit?: number; slot?: BannerSlot } = {},
): Promise<BannerCollection> {
  const data = await graphqlRequest<{ banners: BannerCollection }>(
    BANNERS_QUERY,
    { page: 1, limit: 20, ...variables },
  );
  return data.banners;
}

export type { Banner };
