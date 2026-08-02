'use client';

import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql-client';
import { MEDIA_LIST_QUERY, type Media, type MediaListQueryResult } from '@/lib/graphql/media';

/**
 * La biblioteca entera, como en motos: el backend pagina pero no busca, y en
 * los dos sitios que la consumen (la página `/medios` y el selector de la
 * ficha) lo que más se hace es buscar. Si la biblioteca pasa de unos pocos
 * miles de archivos hay que mover búsqueda y paginación a la query.
 */
export const MEDIA_KEY = ['media'] as const;

const LIMITE_BACKEND = 200; // tope del validador de `mediaList`
const MAX_PAGINAS = 25; // freno de mano: 5.000 archivos

async function traerTodo(trashed: boolean): Promise<Media[]> {
  const primera = await graphqlClient.request<MediaListQueryResult>(MEDIA_LIST_QUERY, {
    page: 1,
    limit: LIMITE_BACKEND,
    trashed,
  });

  const paginas = Math.min(Math.ceil(primera.mediaList.total / LIMITE_BACKEND), MAX_PAGINAS);
  const media = [...primera.mediaList.media];

  for (let page = 2; page <= paginas; page += 1) {
    const siguiente = await graphqlClient.request<MediaListQueryResult>(MEDIA_LIST_QUERY, {
      page,
      limit: LIMITE_BACKEND,
      trashed,
    });
    media.push(...siguiente.mediaList.media);
  }

  return media;
}

export function useMediaQuery(trashed: boolean) {
  return useQuery({
    queryKey: [...MEDIA_KEY, trashed ? 'papelera' : 'activos'],
    queryFn: () => traerTodo(trashed),
  });
}
