import { formatCop } from '@/lib/format';
import type { ServicePricing, ServicePricingMode } from '@/lib/graphql/services';

/**
 * Cómo se lee un precio de servicio en el panel. La forma la manda el backend
 * (`backend/src/types/services/service.types.ts`) y las tres capas la leen
 * igual; esto es solo el formateo.
 *
 * Regla que se repite en las tres: **un precio ausente (`null`) se lee como
 * `A_CONVENIR`**. Es la única equivalencia permitida y existe para que un
 * registro creado a mano no deje la tarjeta vacía.
 */
export const ETIQUETAS_MODALIDAD: Record<ServicePricingMode, string> = {
  DESDE: 'Desde un monto',
  FIJO: 'Precio fijo',
  A_CONVENIR: 'A convenir',
};

/** El modo de un precio, tolerando que no haya precio guardado. */
export function modoDePrecio(pricing?: ServicePricing | null): ServicePricingMode {
  return pricing?.mode ?? 'A_CONVENIR';
}

/**
 * El precio en una línea: `"Desde $ 150.000"`, `"$ 150.000"`, `"A convenir"`.
 * La nota (`cada 5.000 km`) **no entra aquí**: va aparte, para que la lista
 * pueda mostrar solo el número.
 */
export function formatPrecio(pricing?: ServicePricing | null): string {
  const modo = modoDePrecio(pricing);
  if (modo === 'A_CONVENIR') return 'A convenir';

  const monto = formatCop(pricing?.amount);
  if (!monto) return 'A convenir';
  return modo === 'DESDE' ? `Desde ${monto}` : monto;
}
