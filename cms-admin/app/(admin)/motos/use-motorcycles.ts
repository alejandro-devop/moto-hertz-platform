'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { graphqlClient } from '@/lib/graphql-client';
import {
  MOTORCYCLES_QUERY,
  MOTORCYCLE_ADD_MUTATION,
  MOTORCYCLE_EDIT_MUTATION,
  MOTORCYCLE_PURGE_MUTATION,
  MOTORCYCLE_REMOVE_MUTATION,
  MOTORCYCLE_RESTORE_MUTATION,
  type Motorcycle,
  type MotorcycleFormInput,
  type MotorcyclesQueryResult,
} from '@/lib/graphql/motorcycles';

export const MOTORCYCLES_KEY = ['motorcycles'] as const;

/**
 * El catálogo entero, página por página.
 *
 * El backend pagina pero no busca ni ordena, y buscar es lo que más se hace en
 * esta pantalla. Con ~120 motos traerlas todas y filtrar en el cliente da una
 * búsqueda instantánea sin tocar el backend. Si el catálogo pasa de unos pocos
 * miles, hay que mover búsqueda, orden y paginación a la query.
 */
const LIMITE_BACKEND = 100; // tope del validador de `motorcycles`
const MAX_PAGINAS = 40; // freno de mano: 4.000 motos

async function traerTodo(trashed: boolean): Promise<MotorcyclesQueryResult> {
  const primera = await graphqlClient.request<MotorcyclesQueryResult>(MOTORCYCLES_QUERY, {
    page: 1,
    limit: LIMITE_BACKEND,
    trashed,
  });

  const total = primera.motorcycles.total;
  const paginas = Math.min(Math.ceil(total / LIMITE_BACKEND), MAX_PAGINAS);
  const motorcycles = [...primera.motorcycles.motorcycles];

  for (let page = 2; page <= paginas; page += 1) {
    const siguiente = await graphqlClient.request<MotorcyclesQueryResult>(MOTORCYCLES_QUERY, {
      page,
      limit: LIMITE_BACKEND,
      trashed,
    });
    motorcycles.push(...siguiente.motorcycles.motorcycles);
  }

  return { motorcycles: { ...primera.motorcycles, motorcycles } };
}

/**
 * El catálogo o la papelera, según se pida. Son dos consultas distintas al
 * backend (`trashed`) y dos entradas de caché: cambiar de una a otra no mezcla
 * las listas ni deja motos borradas en la vista normal.
 */
export function useMotorcyclesQuery(trashed = false) {
  return useQuery({
    queryKey: [...MOTORCYCLES_KEY, trashed ? 'papelera' : 'activas'],
    queryFn: () => traerTodo(trashed),
  });
}

/** Campos sueltos para las acciones rápidas (precio, publicación). */
export type MotorcyclePatch = Partial<MotorcycleFormInput> & { id: string };

export function useMotorcycleMutations() {
  const queryClient = useQueryClient();

  /* Invalida catálogo y papelera: casi todo lo que cambia mueve una moto de
     una lista a la otra. */
  function refetch() {
    return queryClient.invalidateQueries({ queryKey: MOTORCYCLES_KEY });
  }

  const add = useMutation({
    mutationFn: (input: MotorcycleFormInput) =>
      graphqlClient.request(MOTORCYCLE_ADD_MUTATION, { input }),
    onSuccess: async () => {
      await refetch();
      toast.success('Moto publicada');
    },
    onError: (error: unknown) => {
      registrarError('motos', error);
      toast.error(mensajeDeError(error));
    },
  });

  const edit = useMutation({
    mutationFn: (input: MotorcycleFormInput & { id: string }) =>
      graphqlClient.request(MOTORCYCLE_EDIT_MUTATION, { input }),
    onSuccess: async () => {
      await refetch();
      toast.success('Cambios guardados');
    },
    onError: (error: unknown) => {
      registrarError('motos', error);
      toast.error(mensajeDeError(error));
    },
  });

  /** Edición parcial: solo viaja lo que cambió. */
  const patch = useMutation({
    mutationFn: ({ mensaje: _mensaje, ...input }: MotorcyclePatch & { mensaje: string }) =>
      graphqlClient.request(MOTORCYCLE_EDIT_MUTATION, { input }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(variables.mensaje);
    },
    onError: (error: unknown) => {
      registrarError('motos', error);
      toast.error(mensajeDeError(error));
    },
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) =>
      graphqlClient.request(MOTORCYCLE_REMOVE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`"${variables.name}" se movió a la papelera`);
    },
    onError: (error: unknown) => {
      registrarError('motos', error);
      toast.error(mensajeDeError(error));
    },
  });

  const restore = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) =>
      graphqlClient.request(MOTORCYCLE_RESTORE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`"${variables.name}" volvió al catálogo`);
    },
    onError: (error: unknown) => {
      registrarError('motos', error);
      toast.error(mensajeDeError(error));
    },
  });

  const purge = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) =>
      graphqlClient.request(MOTORCYCLE_PURGE_MUTATION, { id }),
    onSuccess: async (_data, variables) => {
      await refetch();
      toast.success(`Se eliminó "${variables.name}" definitivamente`);
    },
    onError: (error: unknown) => {
      registrarError('motos', error);
      toast.error(mensajeDeError(error));
    },
  });

  return { add, edit, patch, remove, restore, purge };
}

/** Marcas y sedes presentes en el catálogo, para armar los filtros. */
export function collectFacets(motorcycles: Motorcycle[]) {
  const marcas = new Set<string>();
  const sedes = new Set<string>();
  for (const motorcycle of motorcycles) {
    if (motorcycle.brand) marcas.add(motorcycle.brand);
    if (motorcycle.location?.name) sedes.add(motorcycle.location.name);
  }
  const ordenar = (values: Set<string>) => [...values].sort((a, b) => a.localeCompare(b, 'es'));
  return { marcas: ordenar(marcas), sedes: ordenar(sedes) };
}
