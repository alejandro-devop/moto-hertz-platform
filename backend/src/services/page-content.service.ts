import { and, eq } from 'drizzle-orm';
import { getDb } from '../shared/database/drizzle';
import { pageContent } from '../shared/database/schema';
import type { PageContentField, SetPageContentFieldInput } from '../types/services/page-content.types';

async function getPageContent(page: string): Promise<PageContentField[]> {
  const db = getDb();
  const rows = await db.select().from(pageContent).where(eq(pageContent.page, page));
  return rows as PageContentField[];
}

/**
 * No hay `onConflictDoUpdate` en ningún otro service de este proyecto — se
 * mantiene el mismo criterio explícito (leer y, según exista, `update` o
 * `insert`) en vez de introducir un patrón nuevo para un solo dominio. Todos
 * los campos se escriben en una transacción: a mitad de camino no puede
 * quedar un guardado a medias.
 */
async function setPageContentMany(
  page: string,
  fields: SetPageContentFieldInput[]
): Promise<PageContentField[]> {
  const db = getDb();

  await db.transaction(async (tx) => {
    for (const { field, value } of fields) {
      const [existing] = await tx
        .select({ id: pageContent.id })
        .from(pageContent)
        .where(and(eq(pageContent.page, page), eq(pageContent.field, field)))
        .limit(1);

      if (existing) {
        await tx
          .update(pageContent)
          .set({ value, updatedAt: new Date() })
          .where(eq(pageContent.id, existing.id));
      } else {
        await tx.insert(pageContent).values({ page, field, value });
      }
    }
  });

  return getPageContent(page);
}

export const pageContentService = {
  getPageContent,
  setPageContentMany,
};
