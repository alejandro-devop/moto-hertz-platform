'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { graphqlClient } from '@/lib/graphql-client';
import {
  TOUR_PROGRESS_QUERY,
  TOUR_RESET_MUTATION,
  TOUR_SEEN_MUTATION,
  type TourProgress,
  type TourProgressQueryResult,
  type TourResetResult,
  type TourSeenResult,
  type TourStatus,
} from '@/lib/graphql/tours';

export const TOUR_PROGRESS_KEY = ['tour-progress'] as const;

/**
 * Qué recorridos vio ya este usuario. Se pide **una sola vez** por sesión de
 * navegador: es un dato que solo cambia porque este mismo panel lo cambió, así
 * que revalidarlo al recuperar el foco no aporta nada y sí puede disparar un
 * recorrido a destiempo.
 */
export function useTourProgressQuery() {
  return useQuery({
    queryKey: TOUR_PROGRESS_KEY,
    queryFn: () => graphqlClient.request<TourProgressQueryResult>(TOUR_PROGRESS_QUERY),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useTourMutations() {
  const queryClient = useQueryClient();

  /**
   * Marcar visto es optimista y **no avisa de nada**: la caché se actualiza al
   * instante y la mutación va detrás. Si falla, el peor caso es que el
   * recorrido salga una vez más — no hay razón para interrumpir a nadie con
   * un error por esto, así que solo queda en la consola.
   */
  const marcarVisto = useMutation({
    mutationFn: (variables: { key: string; version: number; status: TourStatus }) =>
      graphqlClient.request<TourSeenResult>(TOUR_SEEN_MUTATION, variables),
    onMutate: async ({ key, version, status }) => {
      await queryClient.cancelQueries({ queryKey: TOUR_PROGRESS_KEY });
      queryClient.setQueryData<TourProgressQueryResult>(TOUR_PROGRESS_KEY, (actual) => {
        const visto: TourProgress = {
          tourKey: key,
          version,
          status,
          seenAt: new Date().toISOString(),
        };
        const resto = (actual?.tourProgress ?? []).filter((item) => item.tourKey !== key);
        return { tourProgress: [...resto, visto] };
      });
    },
    onError: (error: unknown) => registrarError('tours:marcar-visto', error),
  });

  /**
   * Reiniciar sí avisa: es una acción que el usuario pidió a propósito y
   * espera confirmación. Se dice cuántos se reiniciaron para distinguir
   * «listo» de «no había nada que reiniciar».
   */
  const reiniciar = useMutation({
    mutationFn: (key?: string) =>
      graphqlClient.request<TourResetResult>(TOUR_RESET_MUTATION, { key: key ?? null }),
    onSuccess: async ({ tourReset }) => {
      await queryClient.invalidateQueries({ queryKey: TOUR_PROGRESS_KEY });
      toast.success(
        tourReset === 0
          ? 'No había recorridos vistos que reiniciar.'
          : tourReset === 1
            ? 'Recorrido reiniciado. Vuelve a la sección para verlo.'
            : `${tourReset} recorridos reiniciados. Vuelven a salir al entrar a cada sección.`
      );
    },
    onError: (error: unknown) => {
      registrarError('tours:reiniciar', error);
      toast.error(mensajeDeError(error));
    },
  });

  return { marcarVisto, reiniciar };
}
