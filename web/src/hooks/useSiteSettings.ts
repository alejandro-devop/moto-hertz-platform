import { useQuery } from "@tanstack/react-query";
import { useIsClient } from "@/hooks/useHydration";
import {
  SITE_SETTINGS_FALLBACK,
  getSiteSettings,
} from "@/services/site-settings";

/**
 * `site_settings` (Fase 6 del plan CMS) se usa en varios componentes
 * cliente —el pie de página, el autor por defecto de una noticia sin firma,
 * el mock del carrusel—, así que la consulta y el respaldo se comparten aquí
 * en vez de repetirse en cada uno.
 *
 * **Por qué `useIsClient` y no solo `data ?? SITE_SETTINGS_FALLBACK`.** El
 * servidor siempre renderiza con `data` sin resolver (`useQuery` no hace
 * fetch durante SSR), así que la primera pasada usa el respaldo. Pero si el
 * componente que llama a este hook se carga con `next/dynamic` (como
 * `Footer`), el chunk puede tardar en llegar al cliente lo suficiente como
 * para que la consulta ya haya resuelto antes de que React reconcilie esa
 * primera pasada — y ahí el HTML del cliente ya no coincide con el que mandó
 * el servidor: error de hidratación. Mismo criterio que ya usa
 * `Banner.tsx` (`useIsClient`) para su propio mock: mientras `isClient` es
 * `false` (servidor y la primera pasada del cliente) siempre se devuelve el
 * respaldo, y solo después de montar se muestra el dato real.
 */
export function useSiteSettings() {
  const isClient = useIsClient();
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
  });

  if (!isClient) return SITE_SETTINGS_FALLBACK;
  return data ?? SITE_SETTINGS_FALLBACK;
}
