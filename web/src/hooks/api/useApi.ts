import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { httpClient, type RequestOptions } from "@/utils";

/**
 * Hook personalizado para queries GET usando el httpClient
 */
export function useApiQuery<TData = unknown, TError = Error>(
  key: string[],
  endpoint: string,
  options?: RequestOptions &
    Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">
) {
  const { params, headers, timeout, ...queryOptions } = options || {};

  return useQuery<TData, TError>({
    queryKey: key,
    queryFn: () =>
      httpClient.get<TData>(endpoint, { params, headers, timeout }),
    ...queryOptions,
  });
}

type PostVariables<T = unknown> = {
  endpoint: string;
  data?: T;
};

type PutVariables<T = unknown> = {
  endpoint: string;
  data?: T;
};

type DeleteVariables = {
  endpoint: string;
};

type PatchVariables<T = unknown> = {
  endpoint: string;
  data?: T;
};

/**
 * Hook personalizado para mutations POST
 */
export function useApiPost<
  TData = unknown,
  TRequestData = unknown,
  TError = Error
>(
  options?: Omit<
    UseMutationOptions<TData, TError, PostVariables<TRequestData>>,
    "mutationFn"
  > & {
    requestOptions?: RequestOptions;
  }
) {
  const { requestOptions, ...mutationOptions } = options || {};

  return useMutation<TData, TError, PostVariables<TRequestData>>({
    mutationFn: ({ endpoint, data }) =>
      httpClient.post<TData>(endpoint, data, requestOptions),
    ...mutationOptions,
  });
}

/**
 * Hook personalizado para mutations PUT
 */
export function useApiPut<
  TData = unknown,
  TRequestData = unknown,
  TError = Error
>(
  options?: Omit<
    UseMutationOptions<TData, TError, PutVariables<TRequestData>>,
    "mutationFn"
  > & {
    requestOptions?: RequestOptions;
  }
) {
  const { requestOptions, ...mutationOptions } = options || {};

  return useMutation<TData, TError, PutVariables<TRequestData>>({
    mutationFn: ({ endpoint, data }) =>
      httpClient.put<TData>(endpoint, data, requestOptions),
    ...mutationOptions,
  });
}

/**
 * Hook personalizado para mutations DELETE
 */
export function useApiDelete<TData = unknown, TError = Error>(
  options?: Omit<
    UseMutationOptions<TData, TError, DeleteVariables>,
    "mutationFn"
  > & {
    requestOptions?: RequestOptions;
  }
) {
  const { requestOptions, ...mutationOptions } = options || {};

  return useMutation<TData, TError, DeleteVariables>({
    mutationFn: ({ endpoint }) =>
      httpClient.delete<TData>(endpoint, requestOptions),
    ...mutationOptions,
  });
}

/**
 * Hook personalizado para mutations PATCH
 */
export function useApiPatch<
  TData = unknown,
  TRequestData = unknown,
  TError = Error
>(
  options?: Omit<
    UseMutationOptions<TData, TError, PatchVariables<TRequestData>>,
    "mutationFn"
  > & {
    requestOptions?: RequestOptions;
  }
) {
  const { requestOptions, ...mutationOptions } = options || {};

  return useMutation<TData, TError, PatchVariables<TRequestData>>({
    mutationFn: ({ endpoint, data }) =>
      httpClient.patch<TData>(endpoint, data, requestOptions),
    ...mutationOptions,
  });
}

/**
 * Hook para invalidar queries
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidate: (queryKey: string[]) =>
      queryClient.invalidateQueries({ queryKey }),
    invalidateAll: () => queryClient.invalidateQueries(),
    remove: (queryKey: string[]) => queryClient.removeQueries({ queryKey }),
    clear: () => queryClient.clear(),
  };
}
