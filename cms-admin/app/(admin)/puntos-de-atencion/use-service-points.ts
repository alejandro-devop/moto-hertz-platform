'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { graphqlClient } from '@/lib/graphql-client';
import {
  SERVICE_POINTS_QUERY,
  SERVICE_POINT_ADD_MUTATION,
  SERVICE_POINT_EDIT_MUTATION,
  SERVICE_POINT_PURGE_MUTATION,
  SERVICE_POINT_REMOVE_MUTATION,
  SERVICE_POINT_RESTORE_MUTATION,
  type ServicePointFormInput,
  type ServicePointsQueryResult,
} from '@/lib/graphql/service-points';

export const SERVICE_POINTS_KEY = ['service-points'] as const;

/**
 * Todos los puntos de una sola vez. Aquí no hay problema de escala: son las
 * sedes de la empresa, no un catálogo — si algún día pasan de 100 habrá que
 * paginar contra el backend, igual que en motos.
 */
const LIMITE_BACKEND = 100; // tope del validador de `servicePoints`

/**
 * Los activos o la papelera, según se pida: dos consultas distintas al backend
 * (`trashed`) con su propia entrada de caché, para que cambiar de una a otra no
 * mezcle las listas.
 */
export function useServicePointsQuery(trashed = false) {
  return useQuery({
    queryKey: [...SERVICE_POINTS_KEY, trashed ? 'papelera' : 'activos'],
    queryFn: () =>
      graphqlClient.request<ServicePointsQueryResult>(SERVICE_POINTS_QUERY, {
        page: 1,
        limit: LIMITE_BACKEND,
        trashed,
      }),
  });
}

export function useServicePointMutations() {
  const queryClient = useQueryClient();

  /* Invalida activos y papelera: casi todo mueve un punto de una a la otra. */
  function refetch() {
    return queryClient.invalidateQueries({ queryKey: SERVICE_POINTS_KEY });
  }

  const add = useMutation({
    mutationFn: (input: ServicePointFormInput) =>
      graphqlClient.request(SERVICE_POINT_ADD_MUTATION, { input }),
    onSuccess: async () => {
      await refetch();
      toast.success('Punto de atención publicado');
    },
    onError: (error: unknown) => {
      registrarError('puntos-de-atencion', error);
      toast.error(mensajeDeError(error));
    },
  });

  const edit = useMutation({
    mutationFn: (input: ServicePointFormInput & { id: string }) =>
      graphqlClient.request(SERVICE_POINT_EDIT_MUTATION, { input }),
    onSuccess: async () => {
      await refetch();
      toast.success('Cambios guardados');
    },
    onError: (error: unknown) => {
      registrarError('puntos-de-atencion', error);
      toast.error(mensajeDeError(error));
    },
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) =>
      graphqlClient.request(SERVICE_POINT_REMOVE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`"${variables.name}" se movió a la papelera`);
    },
    onError: (error: unknown) => {
      registrarError('puntos-de-atencion', error);
      toast.error(mensajeDeError(error));
    },
  });

  const restore = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) =>
      graphqlClient.request(SERVICE_POINT_RESTORE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`"${variables.name}" volvió al sitio`);
    },
    onError: (error: unknown) => {
      registrarError('puntos-de-atencion', error);
      toast.error(mensajeDeError(error));
    },
  });

  const purge = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) =>
      graphqlClient.request(SERVICE_POINT_PURGE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`Se eliminó "${variables.name}" definitivamente`);
    },
    onError: (error: unknown) => {
      registrarError('puntos-de-atencion', error);
      toast.error(mensajeDeError(error));
    },
  });

  return { add, edit, remove, restore, purge };
}
