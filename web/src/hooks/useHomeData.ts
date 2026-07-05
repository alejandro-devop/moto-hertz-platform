import { useState, useEffect, useCallback } from "react";
import { httpClient } from "@/utils/httpClient";
import type { HomePageData } from "@/types/contentful";

interface UseHomeDataOptions {
  /**
   * Si true, hace la petición inmediatamente al montar el componente
   */
  immediate?: boolean;
  /**
   * Si true, usa la API de preview de Contentful
   */
  preview?: boolean;
  /**
   * Intervalo de revalidación en ms (opcional)
   */
  revalidateInterval?: number;
  /**
   * Datos iniciales para SSR/SSG
   */
  initialData?: HomePageData;
  /**
   * Callback para errores
   */
  onError?: (error: Error) => void;
}

interface UseHomeDataReturn {
  data: HomePageData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook para obtener y manejar los datos de la home page desde Contentful
 * Maneja rehidratación, cache y revalidación automática
 */
export function useHomeData(
  options: UseHomeDataOptions = {}
): UseHomeDataReturn {
  const {
    immediate = true,
    preview = false,
    revalidateInterval,
    initialData = null,
    onError,
  } = options;

  const [data, setData] = useState<HomePageData | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData && immediate);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    initialData ? new Date() : null
  );

  // Configurar el cliente HTTP para las peticiones internas
  const configureClient = useCallback(() => {
    if (typeof window !== "undefined") {
      // En el cliente, hacer peticiones a nuestras API routes
      return httpClient.setBaseURL("");
    }
    return httpClient;
  }, []);

  // Función para obtener los datos
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const client = configureClient();

      // Construir URL con parámetros
      const params = new URLSearchParams();
      if (preview) {
        params.append("preview", "true");
      }

      const url = `/api/contentful/home${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const result = await client.get<HomePageData>(url);

      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch home data");
      setError(error);

      if (onError) {
        onError(error);
      }

      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
    }
  }, [preview, onError, configureClient]);

  // Refetch manual
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Efecto para carga inicial
  useEffect(() => {
    if (immediate && !initialData) {
      fetchData();
    }
  }, [immediate, initialData, fetchData]);

  // Efecto para revalidación automática
  useEffect(() => {
    if (!revalidateInterval) return;

    const interval = setInterval(() => {
      // Solo revalidar si no estamos cargando y tenemos datos
      if (!loading && data) {
        fetchData();
      }
    }, revalidateInterval);

    return () => clearInterval(interval);
  }, [revalidateInterval, loading, data, fetchData]);

  // Efecto para rehidratación en el cliente
  useEffect(() => {
    // Si tenemos datos iniciales pero estamos en el cliente y no hay cache reciente
    if (initialData && typeof window !== "undefined" && lastUpdated) {
      const timeSinceUpdate = Date.now() - lastUpdated.getTime();
      const shouldRehydrate = timeSinceUpdate > 5 * 60 * 1000; // 5 minutos

      if (shouldRehydrate) {
        fetchData();
      }
    }
  }, [initialData, lastUpdated, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdated,
  };
}

/**
 * Hook simplificado para casos básicos
 */
export function useHomeDataSimple(initialData?: HomePageData) {
  return useHomeData({
    immediate: true,
    initialData,
    revalidateInterval: 5 * 60 * 1000, // 5 minutos
  });
}
