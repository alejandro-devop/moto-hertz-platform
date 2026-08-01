/**
 * El carrusel de banners de la portada. Primera tabla nueva del plan CMS
 * (Fase 5) — ver `docs/cms-plan/phases/05-home-y-banners.md`.
 *
 * Alcance mínimo acordado con el usuario: solo esto (imagen de escritorio y
 * de móvil, título, subtítulo, enlace y su etiqueta, orden, vigencia y
 * activo). El segundo banner ancho y los títulos de sección de la home
 * quedan fijos en el código de `web`, no en este dominio.
 */
export type BannerSlot = 'HOME' | 'SECUNDARIO';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  /** Si falta, el sitio usa `image` también en pantallas pequeñas. */
  imageMobile?: string | null;
  link?: string | null;
  linkLabel?: string | null;
  /** Dónde aparece este banner en `web`. */
  slot: BannerSlot;
  /** El orden dentro de su slot. Un banner nuevo se agrega al final del suyo. */
  position: number;
  active: boolean;
  /** Sin fecha, el banner ya está vigente. */
  startsAt?: Date | null;
  /** Sin fecha, el banner no vence nunca. */
  endsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Con valor, el banner está en la papelera. No sale en ningún listado normal. */
  deletedAt?: Date | null;
}

export interface BannerCollection {
  banners: Banner[];
  page: number;
  limit: number;
  total: number;
}

export interface ListBannersOptions {
  page?: number;
  limit?: number;
  /** Sin esto, trae banners de todos los slots (lo que usa el panel). */
  slot?: BannerSlot;
  /** `true` = solo la papelera. Por defecto, solo lo no borrado. */
  trashed?: boolean;
  /**
   * El sitio público solo ve banners **activos y dentro de vigencia**; el
   * panel los ve todos siempre, papelera aparte. Lo decide el resolver según
   * haya sesión — nunca el argumento que manda quien pregunta (mismo criterio
   * que `onlyPublished` en `news`).
   */
  onlyVisible?: boolean;
}

export interface CreateBannerInput {
  title: string;
  subtitle?: string;
  image: string;
  imageMobile?: string;
  link?: string;
  linkLabel?: string;
  slot: BannerSlot;
  active?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

export interface UpdateBannerInput extends Partial<CreateBannerInput> {}
