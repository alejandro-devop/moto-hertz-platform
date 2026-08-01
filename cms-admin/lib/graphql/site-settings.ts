/**
 * Configuración global del sitio: documentos GraphQL y tipos, espejo del SDL
 * de `backend/src/graphql/modules/site-settings/site-settings.schema.ts`.
 *
 * A diferencia de todo el resto de los dominios, no hay `List`, `Add` ni
 * `Remove`: `site_settings` es un registro único, así que solo existen
 * `siteSettings` (sin argumentos) y `siteSettingsEdit`.
 */

export interface SiteSettings {
  id: string;
  siteName: string;
  phone?: string | null;
  email?: string | null;
  /** Campo nuevo de la Fase 6: no existía configuración de WhatsApp a nivel de sitio, solo por punto de atención. */
  whatsapp?: string | null;
  /** Texto libre. No reemplaza las direcciones de cada punto de atención (`service_points`). */
  address?: string | null;
  socialFacebook?: string | null;
  socialInstagram?: string | null;
  socialTwitter?: string | null;
  socialYoutube?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords: string[];
  /** Imagen para compartir en redes (Open Graph). */
  seoImage?: string | null;
  /** Sin valor, el sitio usa el asset estático por defecto. */
  logo?: string | null;
  updatedAt: string;
}

/** Lo que viaja al guardar. La ficha manda el formulario completo cada vez. */
export interface SiteSettingsFormInput {
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

const SITE_SETTINGS_FIELDS = /* GraphQL */ `
  id
  siteName
  phone
  email
  whatsapp
  address
  socialFacebook
  socialInstagram
  socialTwitter
  socialYoutube
  seoTitle
  seoDescription
  seoKeywords
  seoImage
  logo
  updatedAt
`;

export const SITE_SETTINGS_QUERY = /* GraphQL */ `
  query SiteSettings {
    siteSettings {
      ${SITE_SETTINGS_FIELDS}
    }
  }
`;

export const SITE_SETTINGS_EDIT_MUTATION = /* GraphQL */ `
  mutation SiteSettingsEdit($input: SiteSettingsEditInput!) {
    siteSettingsEdit(input: $input) {
      ${SITE_SETTINGS_FIELDS}
    }
  }
`;

export interface SiteSettingsQueryResult {
  siteSettings: SiteSettings;
}

export interface SiteSettingsEditResult {
  siteSettingsEdit: SiteSettings;
}
