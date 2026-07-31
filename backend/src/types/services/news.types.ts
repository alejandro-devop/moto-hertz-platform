/**
 * Noticias: la sección con contenido largo y fecha de publicación. Lo que la
 * distingue de `service` y `service-point` es que la vista pública y la del
 * panel **difieren**: el sitio nunca muestra una noticia sin publicar ni con
 * `publishedAt` en el futuro, pero el panel las ve todas siempre (ver
 * `listNews`/`getNewsBySlug` en `news.service.ts`).
 */

export interface News {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  /**
   * HTML del editor enriquecido del panel (Tiptap), ya saneado por el
   * service antes de guardarse. Ver «Editor de contenido» en
   * `backend/CLAUDE.md`.
   */
  content?: string | null;
  /** Solo el nombre: ver la nota de la migración `009` sobre por qué no hay avatar. */
  author?: string | null;
  /** Texto libre, mismo criterio que `service.category`: el usuario inventa su lista. */
  category?: string | null;
  /**
   * `null` = borrador. En el futuro = programada. Hoy o antes = publicada.
   * La vista pública nunca devuelve un borrador ni una programada.
   */
  publishedAt?: Date | null;
  featured: boolean;
  tags?: string[] | null;
  /** URL de la portada. Mismo campo que `service.image`: ver migración `009`. */
  image?: string | null;
  /** Tal como se le dice al lector: «5 min». Se sugiere del contenido y se puede editar. */
  readTime?: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Con valor, la noticia está en la papelera y no sale en ningún listado. */
  deletedAt?: Date | null;
}

export interface NewsCollection {
  news: News[];
  page: number;
  limit: number;
  total: number;
}

export interface ListNewsOptions {
  category?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  /** `true` = solo la papelera. Por defecto, solo lo no borrado. */
  trashed?: boolean;
  /**
   * `true` cuando la consulta viene del sitio público (sin sesión admin):
   * excluye lo que no tenga `publishedAt`, y lo que lo tenga en el futuro.
   * El resolver la fija según `context.user`; nunca la manda el cliente.
   */
  onlyPublished?: boolean;
}

export interface CreateNewsInput {
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  author?: string;
  category?: string;
  publishedAt?: Date | null;
  featured?: boolean;
  tags?: string[];
  image?: string;
  readTime?: string;
}

export interface UpdateNewsInput extends Partial<CreateNewsInput> {}
