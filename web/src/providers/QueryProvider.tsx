"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Crear una nueva instancia de QueryClient para cada renderizado
  // Esto previene problemas de hidratación en SSR
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuración por defecto para queries
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
            retry: (failureCount, error) => {
              // No reintentar en errores 4xx
              if (error instanceof Error && error.message.includes("4")) {
                return false;
              }
              // Reintentar hasta 3 veces para otros errores
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false, // Desactivar refetch automático al enfocar la ventana
            refetchOnReconnect: true, // Refetch cuando se recupera la conexión
          },
          mutations: {
            // Configuración por defecto para mutations
            retry: false, // No reintentar mutations por defecto
            onError: (error) => {
              // Manejo global de errores en mutations
              console.error("Mutation error:", error);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Solo mostrar devtools en desarrollo */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}
