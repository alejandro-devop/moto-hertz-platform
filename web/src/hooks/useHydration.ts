import { useEffect, useState } from "react";

/**
 * Hook para detectar si el componente ya está hidratado en el cliente
 * Evita errores de hidratación al asegurar que el renderizado sea consistente
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook para manejar valores que pueden diferir entre servidor y cliente
 * Como timestamps, números aleatorios, etc.
 */
export function useClientValue<T>(serverValue: T, clientValue: T): T {
  const isClient = useIsClient();
  return isClient ? clientValue : serverValue;
}

/**
 * Hook para debugging de hidratación
 * Detecta diferencias entre servidor y cliente
 */
export function useHydrationFix() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
