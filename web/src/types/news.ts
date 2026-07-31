/**
 * Espejo del SDL de `backend/src/graphql/modules/news/`. `author` es solo el
 * nombre e `image` es solo la URL de la portada (ver migración `009` del
 * backend): a diferencia de la plantilla original, no hay avatar ni
 * miniatura aparte.
 */
export interface News {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  /** HTML del editor enriquecido del panel, ya saneado por el backend. */
  content?: string | null;
  author?: string | null;
  category?: string | null;
  /**
   * Esta query pública (`news`/`newsList` sin sesión) nunca devuelve un
   * borrador ni algo con `publishedAt` en el futuro, así que aquí siempre es
   * una fecha real, no `null`. El tipo la deja opcional porque así viene del
   * SDL, no porque `web` vaya a recibir un borrador.
   */
  publishedAt?: string | null;
  featured: boolean;
  tags: string[];
  image?: string | null;
  readTime?: string | null;
}

export interface NewsCollection {
  total: number;
  page: number;
  limit: number;
  news: News[];
}
