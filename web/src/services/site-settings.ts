import type { SiteSettings } from "@/types/site-settings";
import { httpClient } from "@/utils";

/**
 * Configuración global del sitio, desde el `backend` propio (Fase 6 del plan
 * CMS). Es un registro único: sin argumentos, sin lista, sin slug.
 */
function getBackendGraphQLUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL ||
    "http://localhost:8080/graphql"
  );
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await httpClient.post<GraphQLResponse<T>>(
    getBackendGraphQLUrl(),
    { query, variables },
  );

  if (response.errors?.length) {
    throw new Error(response.errors.map((e) => e.message).join(", "));
  }

  return response.data as T;
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
`;

const SITE_SETTINGS_QUERY = /* GraphQL */ `
  query SiteSettings {
    siteSettings {
      ${SITE_SETTINGS_FIELDS}
    }
  }
`;

/**
 * Valores de respaldo: los mismos que siembra la migración `011` del backend
 * (que a su vez son los que estaban quemados en el código antes de esta
 * fase). Si el backend no responde, el sitio se ve igual que con él arriba —
 * DoD explícito de la Fase 6. Cualquier componente que use `siteSettings`
 * tiene que poder pintar esto sin que la página se rompa.
 */
export const SITE_SETTINGS_FALLBACK: SiteSettings = {
  id: "0",
  siteName: "Yamaha Oriente",
  phone: "+57 300 000 0000",
  email: "info@yamahaoriente.com",
  whatsapp: null,
  address: "Medellín, Colombia",
  socialFacebook: null,
  socialInstagram: null,
  socialTwitter: null,
  socialYoutube: null,
  seoTitle: "Yamaha Oriente",
  seoDescription: "Sitio web de Yamaha Oriente",
  seoKeywords: [],
  seoImage: null,
  logo: null,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const data = await graphqlRequest<{ siteSettings: SiteSettings }>(
    SITE_SETTINGS_QUERY,
  );
  return data.siteSettings;
}

/**
 * Como `getSiteSettings`, pero nunca rechaza: si el backend no responde
 * devuelve `SITE_SETTINGS_FALLBACK`. Para usar en sitios donde no hay manera
 * razonable de mostrar un estado de error (el layout raíz, el pie de
 * página) — el resto del sitio tiene que seguir funcionando.
 */
export async function getSiteSettingsConFallback(): Promise<SiteSettings> {
  try {
    return await getSiteSettings();
  } catch {
    return SITE_SETTINGS_FALLBACK;
  }
}
