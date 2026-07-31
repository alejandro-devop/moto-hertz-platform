/**
 * Noticias: documentos GraphQL y tipos, espejo del SDL de
 * `backend/src/graphql/modules/news/news.schema.ts`.
 *
 * A diferencia de `service-point`/`service`, `news` no tiene ningún campo
 * anidado: `author` es solo el nombre y `image` es solo la URL (ver la
 * migración `009` del backend). El formulario es casi tan plano como el
 * backend.
 */

export interface News {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  /** HTML del editor enriquecido (Tiptap), ya saneado por el backend. */
  content?: string | null;
  author?: string | null;
  /** Texto libre: no hay catálogo cerrado de categorías. */
  category?: string | null;
  /** `null` = borrador. En el futuro = programada. Hoy o antes = publicada. */
  publishedAt?: string | null;
  featured: boolean;
  tags: string[];
  image?: string | null;
  readTime?: string | null;
  /** Con valor, la noticia está en la papelera. */
  deletedAt?: string | null;
}

/** Lo que viaja al guardar. */
export interface NewsFormInput {
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  author?: string;
  category?: string;
  /** `null` explícito vuelve la noticia a borrador; `undefined` no la toca. */
  publishedAt?: string | null;
  featured: boolean;
  tags: string[];
  image?: string;
  readTime?: string;
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
  deletedAt
`;

export const NEWS_LIST_QUERY = /* GraphQL */ `
  query NewsList($page: Int, $limit: Int, $trashed: Boolean) {
    newsList(page: $page, limit: $limit, trashed: $trashed) {
      total
      page
      limit
      news {
        ${NEWS_FIELDS}
      }
    }
  }
`;

export const NEWS_ADD_MUTATION = /* GraphQL */ `
  mutation NewsAdd($input: NewsInput!) {
    newsAdd(input: $input) {
      ${NEWS_FIELDS}
    }
  }
`;

export const NEWS_EDIT_MUTATION = /* GraphQL */ `
  mutation NewsEdit($input: NewsEditInput!) {
    newsEdit(input: $input) {
      ${NEWS_FIELDS}
    }
  }
`;

/** Manda a la papelera; se puede restaurar. */
export const NEWS_REMOVE_MUTATION = /* GraphQL */ `
  mutation NewsRemove($id: ID!) {
    newsRemove(id: $id)
  }
`;

export const NEWS_RESTORE_MUTATION = /* GraphQL */ `
  mutation NewsRestore($id: ID!) {
    newsRestore(id: $id) {
      id
      deletedAt
    }
  }
`;

/** Definitivo. Solo desde la papelera. */
export const NEWS_PURGE_MUTATION = /* GraphQL */ `
  mutation NewsPurge($id: ID!) {
    newsPurge(id: $id)
  }
`;

export interface NewsListQueryResult {
  newsList: {
    total: number;
    page: number;
    limit: number;
    news: News[];
  };
}
