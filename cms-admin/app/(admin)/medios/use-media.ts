'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { graphqlClient } from '@/lib/graphql-client';
import {
  MEDIA_PURGE_MUTATION,
  MEDIA_REMOVE_MUTATION,
  MEDIA_RESTORE_MUTATION,
} from '@/lib/graphql/media';
import { MEDIA_KEY } from '@/lib/use-media-library';

export { MEDIA_KEY, useMediaQuery } from '@/lib/use-media-library';

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
