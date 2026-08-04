import { and, eq } from 'drizzle-orm';
import { getDb } from '../shared/database/drizzle';
import { tourProgress } from '../shared/database/schema';
import type {
  MarkTourSeenInput,
  ResetTourInput,
  TourProgress,
} from '../types/services/tour.types';

/**
 * Progreso de los recorridos guiados del panel. Fase 0 del plan de tours
 * (`docs/tours-plan/PLAN.md`).
 *
 * Todo lo de aquí está acotado a un `userId`: no existe una operación que lea
 * o borre el progreso de otro usuario, y el `userId` nunca llega del cliente
 * — lo pone el resolver desde el JWT.
 */

/** Todo lo que este usuario ya vio. El panel decide con esto qué toca mostrar. */
async function listTourProgress(userId: string): Promise<TourProgress[]> {
  const db = getDb();
  const rows = await db.select().from(tourProgress).where(eq(tourProgress.userId, userId));
  return rows as TourProgress[];
}

/**
 * Marca un recorrido como visto. Es un upsert sobre `(user_id, tour_key)`:
 * llamarlo dos veces no es un error, y volver a verlo tras un reinicio pisa
 * la fila anterior con la versión y el estado nuevos.
 *
 * Se mantiene el criterio explícito del resto del proyecto (leer y, según
 * exista, `update` o `insert`) en vez de `onConflictDoUpdate`, igual que en
 * `page-content.service.ts`.
 */
async function markTourSeen(input: MarkTourSeenInput): Promise<TourProgress> {
  const db = getDb();
  const { userId, tourKey, version, status } = input;

  const [existing] = await db
    .select({ id: tourProgress.id })
    .from(tourProgress)
    .where(and(eq(tourProgress.userId, userId), eq(tourProgress.tourKey, tourKey)))
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(tourProgress)
      .set({ version, status, seenAt: new Date() })
      .where(eq(tourProgress.id, existing.id))
      .returning();
    return row as TourProgress;
  }

  const [row] = await db
    .insert(tourProgress)
    .values({ userId, tourKey, version, status })
    .returning();
  return row as TourProgress;
}

/**
 * Reiniciar = borrar filas. Sin `tourKey`, borra todo el progreso del usuario
 * (el botón «Reiniciar todos los recorridos» de Configuración); con `tourKey`,
 * solo ese recorrido.
 *
 * Devuelve cuántas filas borró, para que el panel pueda decir «no había nada
 * que reiniciar» en vez de un «listo» que no hizo nada.
 */
async function resetTourProgress(input: ResetTourInput): Promise<number> {
  const db = getDb();
  const { userId, tourKey } = input;

  const condicion = tourKey
    ? and(eq(tourProgress.userId, userId), eq(tourProgress.tourKey, tourKey))
    : eq(tourProgress.userId, userId);

  const borradas = await db.delete(tourProgress).where(condicion).returning({ id: tourProgress.id });
  return borradas.length;
}

export const tourService = {
  listTourProgress,
  markTourSeen,
  resetTourProgress,
};
