/**
 * Servicios del taller: mantenimiento, revisiones, reparaciones, estética.
 *
 * Lo que distingue este dominio de `service-point` son dos cosas: las listas
 * anidadas (`features`, `benefits`) y `pricing`, que es un jsonb con forma
 * propia y **tres modalidades** (ver `ServicePricing`).
 */

/**
 * Cómo se cobra el servicio. Se decidió con el usuario en la Fase 3 del plan
 * CMS y **las tres capas leen esta misma forma**:
 *
 * | Modalidad | Qué significa | `amount` |
 * | --- | --- | --- |
 * | `DESDE` | Hay un piso, el total depende del trabajo | obligatorio |
 * | `FIJO` | Vale eso y punto | obligatorio |
 * | `A_CONVENIR` | Se cotiza; no hay número que publicar | **prohibido** |
 *
 * Agregar una modalidad toca cuatro sitios y ninguno más: este tipo, el
 * `pricingModeSchema` de `validators/schemas/service.schemas.ts`, el
 * `enum ServicePricingMode` del SDL, y `ETIQUETAS_MODALIDAD` en
 * `cms-admin/lib/service-pricing.ts` (más el formateo espejo de
 * `web/src/utils/service-pricing.ts`).
 */
export type ServicePricingMode = 'DESDE' | 'FIJO' | 'A_CONVENIR';

export const SERVICE_PRICING_MODES: ServicePricingMode[] = ['DESDE', 'FIJO', 'A_CONVENIR'];

/**
 * El precio de un servicio.
 *
 * - `currency` es **siempre `COP`**: el taller cobra en pesos. Se guarda de
 *   todas formas para que el sitio no tenga que asumirlo al formatear.
 * - `note` es la nota libre que absorbe lo que el mock llamaba `frequency`:
 *   «cada 5.000 km», «una vez al año», «según el daño».
 * - **`pricing` ausente o `null` se lee como `A_CONVENIR`.** Es la única
 *   equivalencia permitida, y existe para que un registro viejo o creado a
 *   mano no rompa el sitio; el panel siempre manda el objeto completo.
 */
export interface ServicePricing {
  mode: ServicePricingMode;
  /** Monto en pesos. Solo en `DESDE` y `FIJO`. */
  amount?: number;
  currency: 'COP';
  /** Cada cuánto se hace o de qué depende. Texto libre y opcional. */
  note?: string;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  /**
   * Texto libre, **no un catálogo cerrado** (a diferencia del `type` de
   * `service-point`): el usuario está inventando su lista de servicios y no se
   * le puede pedir que pase por un despliegue para nombrar una categoría
   * nueva. El panel sugiere las que ya existen para que converjan.
   */
  category?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  /**
   * Nombre de un icono de `lucide-react` en kebab-case (`wrench`,
   * `shield-check`). El backend valida la **forma**, no la pertenencia al
   * catálogo: el catálogo vive en las dos capas de presentación
   * (`cms-admin/lib/service-icons.ts` y `web/src/utils/service-icons.tsx`), y
   * un nombre desconocido cae en el icono por defecto en vez de romper nada.
   */
  icon?: string | null;
  /** Qué incluye el servicio, en orden. Lista editable en el panel. */
  features?: string[] | null;
  /** Qué gana el cliente, en orden. */
  benefits?: string[] | null;
  pricing?: ServicePricing | null;
  /** Cuánto se demora, tal como se le dice al cliente: «2-3 horas». */
  duration?: string | null;
  featured: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Con valor, el servicio está en la papelera y no sale en ningún listado. */
  deletedAt?: Date | null;
}

export interface ServiceCollection {
  services: Service[];
  page: number;
  limit: number;
  total: number;
}

export interface ListServicesOptions {
  category?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  /** `true` = solo la papelera. Por defecto, solo lo no borrado. */
  trashed?: boolean;
}

export interface CreateServiceInput {
  slug: string;
  name: string;
  category?: string;
  shortDescription?: string;
  fullDescription?: string;
  icon?: string;
  features?: string[];
  benefits?: string[];
  pricing?: ServicePricing;
  duration?: string;
  featured?: boolean;
  image?: string;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {}
