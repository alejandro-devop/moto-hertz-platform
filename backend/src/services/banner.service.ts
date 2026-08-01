import { and, asc, count, eq, gte, isNotNull, isNull, lte, or, SQL } from 'drizzle-orm';
import { getDb } from '../shared/database/drizzle';
import { homeBanners } from '../shared/database/schema';
import { BadRequestError, NotFoundError } from '../shared/errors';
import type {
  Banner,
  BannerCollection,
  BannerSlot,
  CreateBannerInput,
  ListBannersOptions,
  UpdateBannerInput,
} from '../types/services/banner.types';

function buildFilters(options: ListBannersOptions): SQL | undefined {
  /* Papelera: toda lectura la excluye salvo que se pida explícitamente.
     Ver «Soft delete» en `docs/cms-plan/PATRON.md` §1.1. */
  const conditions: SQL[] = [
    options.trashed ? isNotNull(homeBanners.deletedAt) : isNull(homeBanners.deletedAt),
  ];

  /* Sin `slot`, trae banners de todos los slots — lo que usa la lista del
     panel, que los muestra agrupados. `web` siempre pide un slot puntual. */
  if (options.slot) {
    conditions.push(eq(homeBanners.slot, options.slot));
  }

  /* El sitio público solo ve banners activos y dentro de vigencia; el panel
     los ve todos siempre (papelera aparte). Quien decide si esta condición se
     aplica es el resolver, según haya o no sesión — mismo criterio que
     `onlyPublished` en `news`. */
  if (options.onlyVisible) {
    const ahora = new Date();
    conditions.push(eq(homeBanners.active, true));
    conditions.push((or(isNull(homeBanners.startsAt), lte(homeBanners.startsAt, ahora)) as SQL)!);
    conditions.push((or(isNull(homeBanners.endsAt), gte(homeBanners.endsAt, ahora)) as SQL)!);
  }

  return and(...conditions);
}

async function listBanners(options: ListBannersOptions = {}): Promise<BannerCollection> {
  const db = getDb();
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;
  const offset = (page - 1) * limit;
  const where = buildFilters(options);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(homeBanners)
      .where(where)
      /* El orden es el dato: se edita a mano en el panel (subir/bajar o
         arrastrar) y el carrusel del sitio lo respeta tal cual. */
      .orderBy(asc(homeBanners.position), asc(homeBanners.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(homeBanners).where(where),
  ]);

  return {
    banners: rows as Banner[],
    page,
    limit,
    total,
  };
}

/**
 * Por id **sí alcanza la papelera**: restaurar y eliminar definitivamente
 * trabajan justamente sobre registros borrados.
 */
async function getBannerById(id: string): Promise<Banner> {
  const db = getDb();
  const [row] = await db.select().from(homeBanners).where(eq(homeBanners.id, id)).limit(1);
  if (!row) throw new NotFoundError('Banner not found');
  return row as Banner;
}

/** Un banner nuevo se agrega al final de su propio slot: la posición es
 *  cuántos hay hoy en ese slot, no en el sitio entero. */
async function nextPosition(slot: BannerSlot): Promise<number> {
  const db = getDb();
  const [{ value }] = await db
    .select({ value: count() })
    .from(homeBanners)
    .where(and(isNull(homeBanners.deletedAt), eq(homeBanners.slot, slot)));
  return value;
}

async function createBanner(input: CreateBannerInput): Promise<Banner> {
  const db = getDb();
  const position = await nextPosition(input.slot);
  const [row] = await db
    .insert(homeBanners)
    .values({
      ...input,
      position,
    })
    .returning();
  return row as Banner;
}

async function updateBanner(id: string, input: UpdateBannerInput): Promise<Banner> {
  await getBannerById(id);
  const db = getDb();
  const [row] = await db
    .update(homeBanners)
    .set({
      ...input,
      /* `undefined` no toca la columna: solo se reescribe lo que vino. */
      updatedAt: new Date(),
    })
    .where(eq(homeBanners.id, id))
    .returning();
  return row as Banner;
}

/** A la papelera, no al vacío. */
async function trashBanner(id: string): Promise<boolean> {
  const actual = await getBannerById(id);
  if (actual.deletedAt) return true;

  const db = getDb();
  await db
    .update(homeBanners)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(homeBanners.id, id))
    .returning();
  return true;
}

async function restoreBanner(id: string): Promise<Banner> {
  await getBannerById(id);
  const db = getDb();
  const [row] = await db
    .update(homeBanners)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(homeBanners.id, id))
    .returning();
  return row as Banner;
}

/** Definitivo. Solo desde la papelera: hay que decidirlo dos veces. */
async function purgeBanner(id: string): Promise<boolean> {
  const actual = await getBannerById(id);
  if (!actual.deletedAt) {
    throw new BadRequestError(
      'Antes de eliminar definitivamente hay que mandar el banner a la papelera.'
    );
  }

  const db = getDb();
  await db.delete(homeBanners).where(eq(homeBanners.id, id));
  return true;
}

/**
 * El orden completo de un slot, de una sola vez: `ids` trae todos los
 * banners no borrados de ese slot en el orden que quedó tras arrastrar o
 * subir/bajar en el panel, y la posición de cada uno pasa a ser su índice en
 * esa lista. Va en una transacción: a mitad de camino no puede quedar un
 * orden a medio escribir. Reordenar un slot no toca la posición de los
 * demás.
 */
async function reorderBanners(slot: BannerSlot, ids: string[]): Promise<Banner[]> {
  const db = getDb();
  await db.transaction(async (tx) => {
    for (let indice = 0; indice < ids.length; indice++) {
      await tx
        .update(homeBanners)
        .set({ position: indice, updatedAt: new Date() })
        .where(eq(homeBanners.id, ids[indice]));
    }
  });

  const rows = await db
    .select()
    .from(homeBanners)
    .where(and(isNull(homeBanners.deletedAt), eq(homeBanners.slot, slot)))
    .orderBy(asc(homeBanners.position), asc(homeBanners.createdAt));
  return rows as Banner[];
}

export const bannerService = {
  listBanners,
  getBannerById,
  createBanner,
  updateBanner,
  /** Nombre viejo del patrón, comportamiento nuevo: manda a la papelera. */
  deleteBanner: trashBanner,
  trashBanner,
  restoreBanner,
  purgeBanner,
  reorderBanners,
};
