/**
 * Espejo del SDL de `backend/src/graphql/modules/banner/`. Esta query pública
 * (`banners` sin sesión) nunca devuelve un banner inactivo, fuera de vigencia
 * ni en la papelera: lo que llega ya está listo para pintarse tal cual, en el
 * orden en que llega (ver `banner.service.ts` del backend).
 */
export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  /** Si falta, usar `image` también en pantallas pequeñas. */
  imageMobile?: string | null;
  link?: string | null;
  linkLabel?: string | null;
  position: number;
}

export interface BannerCollection {
  total: number;
  page: number;
  limit: number;
  banners: Banner[];
}
