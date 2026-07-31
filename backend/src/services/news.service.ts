import { and, count, desc, eq, isNotNull, isNull, lte, SQL } from 'drizzle-orm';
import sanitizeHtml from 'sanitize-html';
import { getDb } from '../shared/database/drizzle';
import { news } from '../shared/database/schema';
import { BadRequestError, NotFoundError } from '../shared/errors';
import type {
  CreateNewsInput,
  ListNewsOptions,
  News,
  NewsCollection,
  UpdateNewsInput,
} from '../types/services/news.types';

/**
 * Lo que el editor enriquecido del panel (Tiptap) puede producir. Se sanea
 * aquí, al guardar, y **otra vez en `web`** al pintarlo (defensa en
 * profundidad: hoy solo el admin escribe contenido, pero una mutación
 * llamada a mano con `curl` y un JWT robado no debería poder colar un
 * `<script>` en el sitio público). La lista de etiquetas está documentada
 * también en `web/src/utils/sanitize-news-content.ts`; si una cambia, la otra
 * tiene que cambiar igual.
 */
const ETIQUETAS_PERMITIDAS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'code',
  'pre',
  'hr',
];

function sanitizarContenido(content?: string | null): string | undefined {
  if (content === undefined) return undefined;
  if (content === null) return undefined;
  const limpio = sanitizeHtml(content, {
    allowedTags: ETIQUETAS_PERMITIDAS,
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    /* Todo enlace abre en pestaña nueva y sin dejar `window.opener`, sin que
       el editor tenga que preocuparse por eso. */
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
    },
  }).trim();
  return limpio.length > 0 ? limpio : undefined;
}

/** Las listas viajan sin huecos: un renglón vacío no es una etiqueta. */
function limpiarLista(lista?: string[]): string[] | undefined {
  if (lista === undefined) return undefined;
  return lista.map((item) => item.trim()).filter((item) => item.length > 0);
}

function buildFilters(options: ListNewsOptions): SQL | undefined {
  /* Papelera: toda lectura la excluye salvo que se pida explícitamente.
     Ver «Soft delete» en `docs/cms-plan/PATRON.md` §1.1. */
  const conditions: SQL[] = [
    options.trashed ? isNotNull(news.deletedAt) : isNull(news.deletedAt),
  ];

  if (options.category) {
    conditions.push(eq(news.category, options.category));
  }

  if (options.featured !== undefined) {
    conditions.push(eq(news.featured, options.featured));
  }

  /* La regla que distingue a `news` de todo lo demás en este proyecto: la
     vista pública nunca ve un borrador (`publishedAt` nulo) ni algo
     programado para el futuro. Quien decide si esta condición se aplica es
     el resolver, según haya o no sesión — nunca el argumento que manda quien
     pregunta. */
  if (options.onlyPublished) {
    conditions.push(isNotNull(news.publishedAt));
    conditions.push(lte(news.publishedAt, new Date()));
  }

  return and(...conditions);
}

async function listNews(options: ListNewsOptions = {}): Promise<NewsCollection> {
  const db = getDb();
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;
  const offset = (page - 1) * limit;
  const where = buildFilters(options);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(news)
      .where(where)
      /* Más recientes primero: a diferencia de motos/servicios/sedes, aquí la
         fecha manda. Un borrador (sin `publishedAt`) no tiene con qué
         ordenarse por fecha, así que cae al final. */
      .orderBy(desc(news.publishedAt), desc(news.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(news).where(where),
  ]);

  return {
    news: rows as News[],
    page,
    limit,
    total,
  };
}

/**
 * Por slug: lo que consume el detalle del sitio. `onlyPublished` la fija el
 * resolver según haya sesión — con sesión, sirve además como vista previa de
 * un borrador o de algo programado.
 */
async function getNewsBySlug(slug: string, options: { onlyPublished?: boolean } = {}): Promise<News> {
  const db = getDb();
  const conditions: SQL[] = [eq(news.slug, slug), isNull(news.deletedAt)];
  if (options.onlyPublished) {
    conditions.push(isNotNull(news.publishedAt));
    conditions.push(lte(news.publishedAt, new Date()));
  }
  const [row] = await db
    .select()
    .from(news)
    .where(and(...conditions))
    .limit(1);
  if (!row) throw new NotFoundError('News not found');
  return row as News;
}

/**
 * Por id **sí alcanza la papelera**: restaurar y eliminar definitivamente
 * trabajan justamente sobre registros borrados.
 */
async function getNewsById(id: string): Promise<News> {
  const db = getDb();
  const [row] = await db.select().from(news).where(eq(news.id, id)).limit(1);
  if (!row) throw new NotFoundError('News not found');
  return row as News;
}

async function createNews(input: CreateNewsInput): Promise<News> {
  const db = getDb();
  const [row] = await db
    .insert(news)
    .values({
      ...input,
      content: sanitizarContenido(input.content),
      tags: limpiarLista(input.tags) ?? [],
    })
    .returning();
  return row as News;
}

async function updateNews(id: string, input: UpdateNewsInput): Promise<News> {
  await getNewsById(id);
  const db = getDb();
  const [row] = await db
    .update(news)
    .set({
      ...input,
      /* `undefined` no toca la columna: solo se reescribe lo que vino. */
      content: sanitizarContenido(input.content),
      tags: limpiarLista(input.tags),
      updatedAt: new Date(),
    })
    .where(eq(news.id, id))
    .returning();
  return row as News;
}

/** A la papelera, no al vacío. */
async function trashNews(id: string): Promise<boolean> {
  const actual = await getNewsById(id);
  if (actual.deletedAt) return true;

  const db = getDb();
  await db
    .update(news)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(news.id, id))
    .returning();
  return true;
}

async function restoreNews(id: string): Promise<News> {
  await getNewsById(id);
  const db = getDb();
  const [row] = await db
    .update(news)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(news.id, id))
    .returning();
  return row as News;
}

/** Definitivo. Solo desde la papelera: hay que decidirlo dos veces. */
async function purgeNews(id: string): Promise<boolean> {
  const actual = await getNewsById(id);
  if (!actual.deletedAt) {
    throw new BadRequestError(
      'Antes de eliminar definitivamente hay que mandar la noticia a la papelera.'
    );
  }

  const db = getDb();
  await db.delete(news).where(eq(news.id, id));
  return true;
}

export const newsService = {
  listNews,
  getNewsBySlug,
  getNewsById,
  createNews,
  updateNews,
  /** Nombre viejo del patrón, comportamiento nuevo: manda a la papelera. */
  deleteNews: trashNews,
  trashNews,
  restoreNews,
  purgeNews,
};
