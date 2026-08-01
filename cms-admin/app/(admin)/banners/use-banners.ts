'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { graphqlClient } from '@/lib/graphql-client';
import {
  BANNERS_QUERY,
  BANNER_ADD_MUTATION,
  BANNER_EDIT_MUTATION,
  BANNER_PURGE_MUTATION,
  BANNER_REMOVE_MUTATION,
  BANNER_REORDER_MUTATION,
  BANNER_RESTORE_MUTATION,
  type BannerFormInput,
  type BannersQueryResult,
} from '@/lib/graphql/banners';

export const BANNERS_KEY = ['banners'] as const;

/** El carrusel de la home: son unos pocos banners, no un catálogo. */
const LIMITE_BACKEND = 100;

/**
 * Los activos o la papelera, según se pida: dos consultas distintas al backend
 * (`trashed`) con su propia entrada de caché, para que cambiar de una a otra no
 * mezcle las listas.
 */
export function useBannersQuery(trashed = false) {
  return useQuery({
    queryKey: [...BANNERS_KEY, trashed ? 'papelera' : 'activos'],
    queryFn: () =>
      graphqlClient.request<BannersQueryResult>(BANNERS_QUERY, {
        page: 1,
        limit: LIMITE_BACKEND,
        trashed,
      }),
  });
}

export function useBannerMutations() {
  const queryClient = useQueryClient();

  /* Invalida activos y papelera: casi todo mueve un banner de una a la otra. */
  function refetch() {
    return queryClient.invalidateQueries({ queryKey: BANNERS_KEY });
  }

  const add = useMutation({
    mutationFn: (input: BannerFormInput) => graphqlClient.request(BANNER_ADD_MUTATION, { input }),
    onSuccess: async () => {
      await refetch();
      toast.success('Banner publicado');
    },
    onError: (error: unknown) => {
      registrarError('banners', error);
      toast.error(mensajeDeError(error));
    },
  });

  const edit = useMutation({
    mutationFn: (input: BannerFormInput & { id: string }) =>
      graphqlClient.request(BANNER_EDIT_MUTATION, { input }),
    onSuccess: async () => {
      await refetch();
      toast.success('Cambios guardados');
    },
    onError: (error: unknown) => {
      registrarError('banners', error);
      toast.error(mensajeDeError(error));
    },
  });

  /** Un solo campo desde la lista (activar / desactivar). */
  const patch = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<BannerFormInput>) =>
      graphqlClient.request(BANNER_EDIT_MUTATION, { input: { id, ...input } }),
    onSuccess: async () => {
      await refetch();
    },
    onError: (error: unknown) => {
      registrarError('banners', error);
      toast.error(mensajeDeError(error));
    },
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string; title: string }) =>
      graphqlClient.request(BANNER_REMOVE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`"${variables.title}" se movió a la papelera`);
    },
    onError: (error: unknown) => {
      registrarError('banners', error);
      toast.error(mensajeDeError(error));
    },
  });

  const restore = useMutation({
    mutationFn: ({ id }: { id: string; title: string }) =>
      graphqlClient.request(BANNER_RESTORE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`"${variables.title}" volvió al sitio`);
    },
    onError: (error: unknown) => {
      registrarError('banners', error);
      toast.error(mensajeDeError(error));
    },
  });

  const purge = useMutation({
    mutationFn: ({ id }: { id: string; title: string }) =>
      graphqlClient.request(BANNER_PURGE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`Se eliminó "${variables.title}" definitivamente`);
    },
    onError: (error: unknown) => {
      registrarError('banners', error);
      toast.error(mensajeDeError(error));
    },
  });

  /**
   * El orden completo, tras subir/bajar o arrastrar una fila: `ids` es el
   * orden final, de arriba a abajo.
   */
  const reorder = useMutation({
    mutationFn: (ids: string[]) => graphqlClient.request(BANNER_REORDER_MUTATION, { ids }),
    onSuccess: async () => {
      await refetch();
    },
    onError: (error: unknown) => {
      registrarError('banners', error);
      toast.error(mensajeDeError(error));
    },
  });

  return { add, edit, patch, remove, restore, purge, reorder };
}
