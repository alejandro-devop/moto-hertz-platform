'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { graphqlClient } from '@/lib/graphql-client';
import {
  SERVICES_QUERY,
  SERVICE_ADD_MUTATION,
  SERVICE_EDIT_MUTATION,
  SERVICE_PURGE_MUTATION,
  SERVICE_REMOVE_MUTATION,
  SERVICE_RESTORE_MUTATION,
  type ServiceFormInput,
  type ServicesQueryResult,
} from '@/lib/graphql/services';

export const SERVICES_KEY = ['services'] as const;

/**
 * Todos los servicios de una sola vez. Son la carta del taller, no un
 * catálogo: si algún día pasan de 100 habrá que paginar contra el backend.
 */
const LIMITE_BACKEND = 100; // tope del validador de `services`

/**
 * Los activos o la papelera, según se pida: dos consultas distintas al backend
 * (`trashed`) con su propia entrada de caché, para que cambiar de una a otra no
 * mezcle las listas.
 */
export function useServicesQuery(trashed = false) {
  return useQuery({
    queryKey: [...SERVICES_KEY, trashed ? 'papelera' : 'activos'],
    queryFn: () =>
      graphqlClient.request<ServicesQueryResult>(SERVICES_QUERY, {
        page: 1,
        limit: LIMITE_BACKEND,
        trashed,
      }),
  });
}

export function useServiceMutations() {
  const queryClient = useQueryClient();

  /* Invalida activos y papelera: casi todo mueve un servicio de una a la otra. */
  function refetch() {
    return queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
  }

  const add = useMutation({
    mutationFn: (input: ServiceFormInput) =>
      graphqlClient.request(SERVICE_ADD_MUTATION, { input }),
    onSuccess: async () => {
      await refetch();
      toast.success('Servicio publicado');
    },
    onError: (error: unknown) => {
      registrarError('servicios', error);
      toast.error(mensajeDeError(error));
    },
  });

  const edit = useMutation({
    mutationFn: (input: ServiceFormInput & { id: string }) =>
      graphqlClient.request(SERVICE_EDIT_MUTATION, { input }),
    onSuccess: async () => {
      await refetch();
      toast.success('Cambios guardados');
    },
    onError: (error: unknown) => {
      registrarError('servicios', error);
      toast.error(mensajeDeError(error));
    },
  });

  /** Un solo campo desde la lista (destacar / dejar de destacar). */
  const patch = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<ServiceFormInput>) =>
      graphqlClient.request(SERVICE_EDIT_MUTATION, { input: { id, ...input } }),
    onSuccess: async () => {
      await refetch();
    },
    onError: (error: unknown) => {
      registrarError('servicios', error);
      toast.error(mensajeDeError(error));
    },
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) =>
      graphqlClient.request(SERVICE_REMOVE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`"${variables.name}" se movió a la papelera`);
    },
    onError: (error: unknown) => {
      registrarError('servicios', error);
      toast.error(mensajeDeError(error));
    },
  });

  const restore = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) =>
      graphqlClient.request(SERVICE_RESTORE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`"${variables.name}" volvió al sitio`);
    },
    onError: (error: unknown) => {
      registrarError('servicios', error);
      toast.error(mensajeDeError(error));
    },
  });

  const purge = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) =>
      graphqlClient.request(SERVICE_PURGE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`Se eliminó "${variables.name}" definitivamente`);
    },
    onError: (error: unknown) => {
      registrarError('servicios', error);
      toast.error(mensajeDeError(error));
    },
  });

  return { add, edit, patch, remove, restore, purge };
}
