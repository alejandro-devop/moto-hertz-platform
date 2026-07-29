import homeMock from "@/data/home-mock.json";
import type { HomePageData } from "@/types/contentful";

/**
 * LEGADO / MOCK TEMPORAL — sigue pendiente de migrar más allá de la Fase 5.
 *
 * Esta plantilla venía integrada con Contentful (REST API) como CMS. En este monorepo
 * el CMS real es `cms-admin` (in-house, ver docs/phases/03-brainstorming-cms.md y
 * 04-scaffold-cms.md) sirviendo datos a través del `backend` GraphQL propio.
 *
 * En la Fase 5 (integración end-to-end) se integró `/motos` contra el backend real
 * (ver web/src/services/motorcycles.ts), pero la home usa un modelo de "layout" tipo
 * Contentful (banners, secciones) sin equivalente en el backend todavía — se decidió
 * diferir esta migración explícitamente (ver docs/architecture/data-flow.md) en vez de
 * expandir el alcance de la fase. Este servicio sigue devolviendo el mock local
 * (src/data/home-mock.json) respetando la misma interfaz (`HomePageData`).
 */
export class ContentfulService {
  private static instance: ContentfulService;

  private constructor() {}

  public static getInstance(): ContentfulService {
    if (!ContentfulService.instance) {
      ContentfulService.instance = new ContentfulService();
    }
    return ContentfulService.instance;
  }

  /**
   * Mock de los datos de la home page. Antes llamaba a Contentful REST API;
   * ahora retorna el fixture local hasta que exista el backend propio.
   */
  public async getHomePageData(): Promise<HomePageData> {
    return homeMock as unknown as HomePageData;
  }

  /**
   * Transformar URL de imagen de Contentful para optimización.
   * Se mantiene por compatibilidad con componentes existentes; no-op para URLs externas.
   */
  public static optimizeImageUrl(
    url: string,
    width?: number,
    height?: number,
    format?: "webp" | "jpg" | "png",
  ): string {
    if (!url.includes("images.ctfassets.net")) {
      return url;
    }

    const params = new URLSearchParams();

    if (width) params.append("w", width.toString());
    if (height) params.append("h", height.toString());
    if (format) params.append("fm", format);

    params.append("q", "85");
    params.append("f", "face");

    return `${url}?${params.toString()}`;
  }
}

// Exportar instancia singleton
export const contentfulService = ContentfulService.getInstance();
