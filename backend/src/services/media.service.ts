import { randomBytes } from 'crypto';
import { and, count, desc, eq, ilike, isNotNull, isNull, or, SQL } from 'drizzle-orm';
import { getDb } from '../shared/database/drizzle';
import { media } from '../shared/database/schema';
import { BadRequestError, NotFoundError } from '../shared/errors';
import { esMimeAceptado, procesarImagen } from '../shared/images/process';
import { getStorage } from '../shared/storage';
import type {
  ListMediaOptions,
  Media,
  MediaCollection,
} from '../types/services/media.types';

/**
 * Clave no adivinable, agrupada por año/mes para que la carpeta no crezca a
 * decenas de miles de archivos planos. 16 bytes de aleatoriedad: nadie enumera
 * la biblioteca probando URLs.
 */
function nuevaClave(extension: string): string {
  const ahora = new Date();
  const anio = ahora.getUTCFullYear();
  const mes = String(ahora.getUTCMonth() + 1).padStart(2, '0');
  return `${anio}/${mes}/${randomBytes(16).toString('hex')}.${extension}`;
}

/** El filtro que se repite en toda lectura: la papelera está aparte. */
function filtroPapelera(trashed?: boolean): SQL | undefined {
  return trashed ? isNotNull(media.deletedAt) : isNull(media.deletedAt);
}

async function listMedia(options: ListMediaOptions = {}): Promise<MediaCollection> {
  const db = getDb();
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;
  const offset = (page - 1) * limit;

  const condiciones: (SQL | undefined)[] = [filtroPapelera(options.trashed)];
  if (options.q) {
    const patron = `%${options.q}%`;
    condiciones.push(or(ilike(media.originalName, patron), ilike(media.key, patron)));
  }
  const where = and(...(condiciones.filter(Boolean) as SQL[]));

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(media)
      .where(where)
      .orderBy(desc(media.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(media).where(where),
  ]);

  return { media: rows as Media[], page, limit, total };
}

async function getMediaById(id: string): Promise<Media> {
  const db = getDb();
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!row) throw new NotFoundError('Media not found');
  return row as Media;
}

export interface UploadMediaInput {
  buffer: Buffer;
  mimeType?: string;
  originalName?: string;
}

/**
 * El único camino por el que entra un archivo: valida, procesa a WebP, lo
 * guarda en el driver y deja el registro. Si la escritura en la base falla
 * después de guardar el archivo, el archivo se quita — un huérfano en disco no
 * se ve desde ningún lado y nadie lo va a limpiar después.
 */
async function uploadMedia(input: UploadMediaInput): Promise<Media> {
  if (!input.buffer?.length) {
    throw new BadRequestError('El archivo llegó vacío.');
  }
  if (!esMimeAceptado(input.mimeType)) {
    throw new BadRequestError(
      `"${input.originalName ?? 'el archivo'}" no es una imagen (${input.mimeType ?? 'tipo desconocido'}). Sube un JPG, PNG, WebP o HEIC.`
    );
  }

  const procesada = await procesarImagen(input.buffer);
  const storage = getStorage();
  const key = nuevaClave(procesada.extension);

  await storage.put(key, procesada.buffer, procesada.mimeType);

  try {
    const db = getDb();
    const [row] = await db
      .insert(media)
      .values({
        key,
        url: storage.url(key),
        driver: storage.name,
        mimeType: procesada.mimeType,
        sizeBytes: procesada.buffer.length,
        width: procesada.width,
        height: procesada.height,
        originalName: input.originalName?.slice(0, 255),
      })
      .returning();
    return row as Media;
  } catch (error) {
    await storage.delete(key).catch(() => undefined);
    throw error;
  }
}

/** A la papelera. El archivo sigue en su sitio y la URL sigue respondiendo. */
async function trashMedia(id: string): Promise<Media> {
  const actual = await getMediaById(id);
  if (actual.deletedAt) return actual;

  const db = getDb();
  const [row] = await db
    .update(media)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(media.id, id))
    .returning();
  return row as Media;
}

async function restoreMedia(id: string): Promise<Media> {
  await getMediaById(id);
  const db = getDb();
  const [row] = await db
    .update(media)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(media.id, id))
    .returning();
  return row as Media;
}

/**
 * Definitivo: borra el archivo del almacenamiento y la fila. Solo desde la
 * papelera, para que haga falta pasar dos veces por la misma decisión.
 */
async function purgeMedia(id: string): Promise<boolean> {
  const actual = await getMediaById(id);
  if (!actual.deletedAt) {
    throw new BadRequestError(
      'Antes de eliminar definitivamente hay que mandar la imagen a la papelera.'
    );
  }

  await getStorage().delete(actual.key);
  const db = getDb();
  await db.delete(media).where(eq(media.id, id));
  return true;
}

export const mediaService = {
  listMedia,
  getMediaById,
  uploadMedia,
  trashMedia,
  restoreMedia,
  purgeMedia,
};
