/**
 * Configuración global del sitio (Fase 6 del plan CMS): contacto, redes
 * sociales, SEO y el nombre del sitio. Espejo del SDL de
 * `backend/src/graphql/modules/site-settings/site-settings.schema.ts`.
 *
 * Es un registro único: no hay lista ni slug, solo esta forma.
 */
export interface SiteSettings {
  id: string;
  siteName: string;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  address: string | null;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialTwitter: string | null;
  socialYoutube: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  seoImage: string | null;
  /** `null` = el sitio usa el asset estático por defecto. */
  logo: string | null;
}
