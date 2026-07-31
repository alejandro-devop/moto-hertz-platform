import type { ServicePricing, ServicePricingMode } from "@/types/service";

/**
 * Cómo se lee un precio de servicio en el sitio. La forma la manda el backend
 * (`backend/src/types/services/service.types.ts`); esto es solo el formateo, y
 * es el espejo de `cms-admin/lib/service-pricing.ts`.
 *
 * Regla escrita en las tres capas: **un precio ausente se lee como
 * `A_CONVENIR`**, para que una tarjeta nunca quede con el precio en blanco.
 */
const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function modoDePrecio(
  pricing?: ServicePricing | null,
): ServicePricingMode {
  return pricing?.mode ?? "A_CONVENIR";
}

/**
 * El precio partido en dos, porque la tarjeta los pinta con tamaños distintos:
 * el rótulo («Desde», «A convenir») y el monto cuando lo hay.
 */
export function partesDePrecio(pricing?: ServicePricing | null): {
  rotulo: string;
  monto: string | null;
} {
  const modo = modoDePrecio(pricing);
  const amount = pricing?.amount;

  if (modo === "A_CONVENIR" || amount === null || amount === undefined) {
    return { rotulo: "Precio", monto: null };
  }

  return {
    rotulo: modo === "DESDE" ? "Desde" : "Precio",
    monto: COP.format(amount).replace(/\s+/g, " "),
  };
}

/** Lo que se muestra cuando no hay monto que publicar. */
export const PRECIO_A_CONVENIR = "A convenir";
