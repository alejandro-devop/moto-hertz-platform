'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { graphqlClient } from '@/lib/graphql-client';
import {
  SITE_SETTINGS_EDIT_MUTATION,
  SITE_SETTINGS_QUERY,
  type SiteSettingsEditResult,
  type SiteSettingsFormInput,
  type SiteSettingsQueryResult,
} from '@/lib/graphql/site-settings';

export const SITE_SETTINGS_KEY = ['site-settings'] as const;

export function useSiteSettingsQuery() {
  return useQuery({
    queryKey: SITE_SETTINGS_KEY,
    queryFn: () => graphqlClient.request<SiteSettingsQueryResult>(SITE_SETTINGS_QUERY),
  });
}

/**
 * La única mutación de este dominio: no hay `add` ni `remove`, `site_settings`
 * es un registro único. El componente usa la fila que devuelve la mutación
 * para reanclar la ficha (ver `page.tsx`) en vez de esperar a que la query se
 * revalide sola.
 */
export function useSiteSettingsMutations() {
  const queryClient = useQueryClient();

  const edit = useMutation({
    mutationFn: (input: SiteSettingsFormInput) =>
      graphqlClient.request<SiteSettingsEditResult>(SITE_SETTINGS_EDIT_MUTATION, { input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SITE_SETTINGS_KEY });
      toast.success('Configuración guardada');
    },
    onError: (error: unknown) => {
      registrarError('configuracion', error);
      toast.error(mensajeDeError(error));
    },
  });

  return { edit };
}
