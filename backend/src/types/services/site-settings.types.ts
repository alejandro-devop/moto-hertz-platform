/**
 * Configuración global del sitio: contacto, redes sociales, SEO y el nombre
 * del sitio. Fase 6 del plan CMS — ver
 * `docs/cms-plan/phases/06-configuracion-sitio.md`.
 *
 * Es un **registro único**: no hay `Create...Input` ni `delete...`, solo
 * `UpdateSiteSettingsInput` sobre la fila que la migración `011` ya crea.
 */
export interface SiteSettings {
  id: number;
  siteName: string;
  phone?: string | null;
  email?: string | null;
  /** Campo nuevo de esta fase: no existía a nivel de sitio, solo por sede. */
  whatsapp?: string | null;
  /** Texto libre. No reemplaza las direcciones de `service_points`. */
  address?: string | null;
  socialFacebook?: string | null;
  socialInstagram?: string | null;
  socialTwitter?: string | null;
  socialYoutube?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords: string[];
  seoImage?: string | null;
  /** `null` = el sitio usa el asset estático por defecto. */
  logo?: string | null;
  updatedAt: Date;
}

export interface UpdateSiteSettingsInput {
  siteName?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialYoutube?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  seoImage?: string;
  logo?: string;
}
