'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { graphqlClient } from '@/lib/graphql-client';
import {
  MEDIA_LIST_QUERY,
  MEDIA_PURGE_MUTATION,
  MEDIA_REMOVE_MUTATION,
  MEDIA_RESTORE_MUTATION,
  type Media,
  type MediaListQueryResult,
} from '@/lib/graphql/media';

export const MEDIA_KEY = ['media'] as const;

/**
 * La biblioteca entera, como en motos: el backend pagina pero no busca, y aquí
 * lo que más se hace es buscar. Si la biblioteca pasa de unos pocos miles de
 * archivos hay que mover búsqueda y paginación a la query.
 */
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

export function useMediaMutations() {
  const queryClient = useQueryClient();

  /* Cualquier cambio afecta a las dos listas (biblioteca y papelera). */
  function refetch() {
    return queryClient.invalidateQueries({ queryKey: MEDIA_KEY });
  }

  function conError(error: unknown) {
    registrarError('medios', error);
    toast.error(mensajeDeError(error));
  }

  const remove = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      graphqlClient.request(MEDIA_REMOVE_MUTATION, { id }),
    onSuccess: async () => {
      await refetch();
      toast.success('La imagen se movió a la papelera');
    },
    onError: conError,
  });

  const restore = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      graphqlClient.request(MEDIA_RESTORE_MUTATION, { id }),
    onSuccess: async () => {
      await refetch();
      toast.success('Imagen restaurada');
    },
    onError: conError,
  });

  const purge = useMutation({
    mutationFn: ({ id }: { id: string }) => graphqlClient.request(MEDIA_PURGE_MUTATION, { id }),
    onSuccess: async () => {
      await refetch();
      toast.success('La imagen se eliminó definitivamente');
    },
    onError: conError,
  });

  return { remove, restore, purge };
}
