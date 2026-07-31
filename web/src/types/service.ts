/** Espejo del SDL de `backend/src/graphql/modules/service/`. */

/**
 * Las tres modalidades de precio. `DESDE` y `FIJO` traen monto; `A_CONVENIR`
 * no. **Un `pricing` en `null` se lee como `A_CONVENIR`**: es la única
 * equivalencia permitida, y está escrita igual en el backend y en el panel.
 */
export type ServicePricingMode = "DESDE" | "FIJO" | "A_CONVENIR";

export interface ServicePricing {
  mode: ServicePricingMode;
  /** En pesos. `null` cuando la modalidad es `A_CONVENIR`. */
  amount?: number | null;
  currency: string;
  /** «cada 5.000 km», «una vez al año». Texto libre y opcional. */
  note?: string | null;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  /** Nombre de un icono de lucide en kebab-case. Ver `utils/service-icons`. */
  icon?: string | null;
  /** Listas **ordenadas**: se pintan en el orden en que llegan. */
  features: string[];
  benefits: string[];
  pricing?: ServicePricing | null;
  duration?: string | null;
  featured: boolean;
  image?: string | null;
}

export interface ServiceCollection {
  total: number;
  page: number;
  limit: number;
  services: Service[];
}
