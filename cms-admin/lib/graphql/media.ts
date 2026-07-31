/**
 * La biblioteca de medios. La **subida** no está aquí: es multipart y va por
 * `/api/media/upload` (ver `lib/media-upload.ts`). Por GraphQL viaja todo lo
 * demás: listar, mandar a la papelera, restaurar y eliminar definitivamente.
 */

export interface Media {
  id: string;
  key: string;
  url: string;
  driver: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  originalName?: string | null;
  createdAt: string;
  /** Con valor, está en la papelera. */
  deletedAt?: string | null;
}

const MEDIA_FIELDS = /* GraphQL */ `
  id
  key
  url
  driver
  mimeType
  sizeBytes
  width
  height
  originalName
  createdAt
  deletedAt
`;

export const MEDIA_LIST_QUERY = /* GraphQL */ `
  query MediaList($page: Int, $limit: Int, $trashed: Boolean) {
    mediaList(page: $page, limit: $limit, trashed: $trashed) {
      total
      page
      limit
      media {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

export const MEDIA_REMOVE_MUTATION = /* GraphQL */ `
  mutation MediaRemove($id: ID!) {
    mediaRemove(id: $id) {
      id
      deletedAt
    }
  }
`;

export const MEDIA_RESTORE_MUTATION = /* GraphQL */ `
  mutation MediaRestore($id: ID!) {
    mediaRestore(id: $id) {
      id
      deletedAt
    }
  }
`;

export const MEDIA_PURGE_MUTATION = /* GraphQL */ `
  mutation MediaPurge($id: ID!) {
    mediaPurge(id: $id)
  }
`;

export interface MediaListQueryResult {
  mediaList: {
    total: number;
    page: number;
    limit: number;
    media: Media[];
  };
}
