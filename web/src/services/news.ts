import type { News, NewsCollection } from "@/types/news";
import { httpClient } from "@/utils";

/**
 * Noticias desde el `backend` propio (Fase 4 del plan CMS). La query es
 * pública, igual que la de motos, puntos de atención y servicios: el sitio
 * no tiene sesión — y por eso mismo el backend nunca le devuelve un borrador
 * ni una noticia programada para el futuro (ver `backend/CLAUDE.md`, sección
 * `news`). `web` no filtra nada de eso: ya viene filtrado.
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

const NEWS_FIELDS = /* GraphQL */ `
  id
  slug
  title
  excerpt
  content
  author
  category
  publishedAt
  featured
  tags
  image
  readTime
`;

const NEWS_LIST_QUERY = /* GraphQL */ `
  query NewsList($page: Int, $limit: Int) {
    newsList(page: $page, limit: $limit) {
      total
      page
      limit
      news {
        ${NEWS_FIELDS}
      }
    }
  }
`;

const NEWS_BY_SLUG_QUERY = /* GraphQL */ `
  query News($slug: String!) {
    news(slug: $slug) {
      ${NEWS_FIELDS}
    }
  }
`;

export async function getNews(
  variables: { page?: number; limit?: number } = {},
): Promise<NewsCollection> {
  const data = await graphqlRequest<{ newsList: NewsCollection }>(
    NEWS_LIST_QUERY,
    { page: 1, limit: 100, ...variables },
  );
  return data.newsList;
}

export async function getNewsBySlug(slug: string): Promise<News | null> {
  const data = await graphqlRequest<{ news: News | null }>(
    NEWS_BY_SLUG_QUERY,
    { slug },
  );
  return data.news;
}
