'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { graphqlClient } from '@/lib/graphql-client';
import {
  NEWS_ADD_MUTATION,
  NEWS_EDIT_MUTATION,
  NEWS_LIST_QUERY,
  NEWS_PURGE_MUTATION,
  NEWS_REMOVE_MUTATION,
  NEWS_RESTORE_MUTATION,
  type NewsFormInput,
  type NewsListQueryResult,
} from '@/lib/graphql/news';

export const NEWS_KEY = ['news'] as const;

/**
 * Todas las noticias de una sola vez, como en `servicios` y `motos`: son
 * pocas y fijas, así que la búsqueda, el filtro y el orden se resuelven en el
 * cliente. Si el catálogo llega a unos pocos miles hay que mover esto a la
 * query (misma nota que dejó la Fase 0 en `motos`).
 */
const LIMITE_BACKEND = 100; // tope del validador de `newsList`

/**
 * Con sesión, el backend devuelve **todo** — borradores y programadas
 * incluidos — sin importar `trashed`; `trashed` decide entre lo activo y la
 * papelera. Dos consultas distintas, cada una con su propia caché, para que
 * cambiar de una a otra no mezcle las listas (ver PATRON.md §1.1).
 */
export function useNewsQuery(trashed = false) {
  return useQuery({
    queryKey: [...NEWS_KEY, trashed ? 'papelera' : 'activos'],
    queryFn: () =>
      graphqlClient.request<NewsListQueryResult>(NEWS_LIST_QUERY, {
        page: 1,
        limit: LIMITE_BACKEND,
        trashed,
      }),
  });
}

export function useNewsMutations() {
  const queryClient = useQueryClient();

  function refetch() {
    return queryClient.invalidateQueries({ queryKey: NEWS_KEY });
  }

  const add = useMutation({
    mutationFn: (input: NewsFormInput) => graphqlClient.request(NEWS_ADD_MUTATION, { input }),
    onSuccess: async () => {
      await refetch();
      toast.success('Noticia guardada');
    },
    onError: (error: unknown) => {
      registrarError('noticias', error);
      toast.error(mensajeDeError(error));
    },
  });

  const edit = useMutation({
    mutationFn: (input: NewsFormInput & { id: string }) =>
      graphqlClient.request(NEWS_EDIT_MUTATION, { input }),
    onSuccess: async () => {
      await refetch();
      toast.success('Cambios guardados');
    },
    onError: (error: unknown) => {
      registrarError('noticias', error);
      toast.error(mensajeDeError(error));
    },
  });

  /** Un solo campo desde la lista (destacar / dejar de destacar). */
  const patch = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<NewsFormInput>) =>
      graphqlClient.request(NEWS_EDIT_MUTATION, { input: { id, ...input } }),
    onSuccess: async () => {
      await refetch();
    },
    onError: (error: unknown) => {
      registrarError('noticias', error);
      toast.error(mensajeDeError(error));
    },
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string; title: string }) =>
      graphqlClient.request(NEWS_REMOVE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`"${variables.title}" se movió a la papelera`);
    },
    onError: (error: unknown) => {
      registrarError('noticias', error);
      toast.error(mensajeDeError(error));
    },
  });

  const restore = useMutation({
    mutationFn: ({ id }: { id: string; title: string }) =>
      graphqlClient.request(NEWS_RESTORE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`"${variables.title}" volvió a la lista`);
    },
    onError: (error: unknown) => {
      registrarError('noticias', error);
      toast.error(mensajeDeError(error));
    },
  });

  const purge = useMutation({
    mutationFn: ({ id }: { id: string; title: string }) =>
      graphqlClient.request(NEWS_PURGE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`Se eliminó "${variables.title}" definitivamente`);
    },
    onError: (error: unknown) => {
      registrarError('noticias', error);
      toast.error(mensajeDeError(error));
    },
  });

  return { add, edit, patch, remove, restore, purge };
}
