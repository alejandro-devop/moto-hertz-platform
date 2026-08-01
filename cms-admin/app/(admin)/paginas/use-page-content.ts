'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { graphqlClient } from '@/lib/graphql-client';
import {
  PAGE_CONTENT_QUERY,
  PAGE_CONTENT_SET_MANY_MUTATION,
  type PageContentQueryResult,
  type PageContentSetManyResult,
  type SetPageContentFieldInput,
} from '@/lib/graphql/page-content';

export function pageContentKey(page: string) {
  return ['page-content', page] as const;
}

export function usePageContentQuery(page: string) {
  return useQuery({
    queryKey: pageContentKey(page),
    queryFn: () => graphqlClient.request<PageContentQueryResult>(PAGE_CONTENT_QUERY, { page }),
  });
}

export function usePageContentMutations(page: string) {
  const queryClient = useQueryClient();

  const setMany = useMutation({
    mutationFn: (fields: SetPageContentFieldInput[]) =>
      graphqlClient.request<PageContentSetManyResult>(PAGE_CONTENT_SET_MANY_MUTATION, {
        page,
        fields,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pageContentKey(page) });
      toast.success('Contenido guardado');
    },
    onError: (error: unknown) => {
      registrarError('paginas', error);
      toast.error(mensajeDeError(error));
    },
  });

  return { setMany };
}
