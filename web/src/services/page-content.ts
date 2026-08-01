import { httpClient } from "@/utils";

/**
 * Contenido editorial suelto de una página (heading, caption, etc.),
 * administrable desde `/paginas` del panel (tabla genérica `page_content` en
 * el backend). Un campo que nunca se guardó no viene en la respuesta —
 * quien llama decide el valor por defecto, el mismo texto que antes estaba
 * quemado en el componente.
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

interface PageContentField {
  field: string;
  value: string | null;
}

const PAGE_CONTENT_QUERY = /* GraphQL */ `
  query PageContent($page: String!) {
    pageContent(page: $page) {
      field
      value
    }
  }
`;

/** Nunca rechaza: si el backend no responde, devuelve un mapa vacío y quien
 * llama sigue usando sus valores por defecto — la página no se rompe. */
export async function getPageContentMap(
  page: string,
): Promise<Record<string, string>> {
  try {
    const response = await httpClient.post<
      GraphQLResponse<{ pageContent: PageContentField[] }>
    >(getBackendGraphQLUrl(), { query: PAGE_CONTENT_QUERY, variables: { page } });

    if (response.errors?.length || !response.data) return {};

    const map: Record<string, string> = {};
    for (const item of response.data.pageContent) {
      if (item.value) map[item.field] = item.value;
    }
    return map;
  } catch {
    return {};
  }
}
