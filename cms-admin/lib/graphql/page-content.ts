/**
 * Contenido editorial suelto de una página del sitio, espejo del SDL de
 * `backend/src/graphql/modules/page-content/page-content.schema.ts`. Tabla
 * genérica `page` + `field` + `value`: un campo que nunca se guardó no
 * aparece en la lista, y quien lo lee (esta ficha) le pone su propio valor
 * por defecto — el mismo texto que hoy está quemado en `web`.
 */

export interface PageContentField {
  page: string;
  field: string;
  value: string | null;
  updatedAt: string;
}

export interface SetPageContentFieldInput {
  field: string;
  value: string;
}

const PAGE_CONTENT_FIELDS = /* GraphQL */ `
  page
  field
  value
  updatedAt
`;

export const PAGE_CONTENT_QUERY = /* GraphQL */ `
  query PageContent($page: String!) {
    pageContent(page: $page) {
      ${PAGE_CONTENT_FIELDS}
    }
  }
`;

export const PAGE_CONTENT_SET_MANY_MUTATION = /* GraphQL */ `
  mutation PageContentSetMany($page: String!, $fields: [PageContentFieldInput!]!) {
    pageContentSetMany(page: $page, fields: $fields) {
      ${PAGE_CONTENT_FIELDS}
    }
  }
`;

export interface PageContentQueryResult {
  pageContent: PageContentField[];
}

export interface PageContentSetManyResult {
  pageContentSetMany: PageContentField[];
}
