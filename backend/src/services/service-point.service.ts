import { and, asc, count, eq, isNotNull, isNull, SQL } from 'drizzle-orm';
import { getDb } from '../shared/database/drizzle';
import { servicePoints } from '../shared/database/schema';
import { BadRequestError, NotFoundError } from '../shared/errors';
import { coordenadasDeMapsUrl } from '../shared/geo/maps-url';
import type {
  CreateServicePointInput,
  ListServicePointsOptions,
  ServicePoint,
  ServicePointCollection,
  ServicePointLocation,
  UpdateServicePointInput,
} from '../types/services/service-point.types';

function buildFilters(options: ListServicePointsOptions): SQL | undefined {
  /* Papelera: toda lectura la excluye salvo que se pida explícitamente.
     Ver «Soft delete» en `docs/cms-plan/PATRON.md` §1.1. */
  const conditions: SQL[] = [
    options.trashed ? isNotNull(servicePoints.deletedAt) : isNull(servicePoints.deletedAt),
  ];

  if (options.type) {
    conditions.push(eq(servicePoints.type, options.type));
  }

  return and(...conditions);
}

/**
 * La latitud y la longitud no se escriben a mano: salen del enlace de Google
 * Maps que se pegó. Se recalculan en cada guardado para que no queden colgadas
 * de un enlace viejo, y si el enlace no las trae el punto se guarda sin ellas
 * (el sitio ofrece «Cómo llegar» sin mapa).
 */
function derivarCoordenadas(location?: ServicePointLocation): ServicePointLocation | undefined {
  if (!location) return undefined;

  const mapsUrl = location.mapsUrl?.trim();
  if (!mapsUrl) return {};

  const coords = coordenadasDeMapsUrl(mapsUrl);
  return coords ? { mapsUrl, lat: coords.lat, lng: coords.lng } : { mapsUrl };
}

async function listServicePoints(
  options: ListServicePointsOptions = {}
): Promise<ServicePointCollection> {
  const db = getDb();
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;
  const offset = (page - 1) * limit;
  const where = buildFilters(options);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(servicePoints)
      .where(where)
      /* Son pocos y fijos: alfabético es el orden en que se buscan, no por
         fecha de creación como el catálogo de motos. */
      .orderBy(asc(servicePoints.name))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(servicePoints).where(where),
  ]);

  return {
    servicePoints: rows as ServicePoint[],
    page,
    limit,
    total,
  };
}

/** El sitio público consulta por slug: un punto en la papelera no existe. */
async function getServicePointBySlug(slug: string): Promise<ServicePoint> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(servicePoints)
    .where(and(eq(servicePoints.slug, slug), isNull(servicePoints.deletedAt)))
    .limit(1);
  if (!row) throw new NotFoundError('Service point not found');
  return row as ServicePoint;
}

/**
 * Por id **sí alcanza la papelera**: restaurar y eliminar definitivamente
 * trabajan justamente sobre registros borrados.
 */
async function getServicePointById(id: string): Promise<ServicePoint> {
  const db = getDb();
  const [row] = await db.select().from(servicePoints).where(eq(servicePoints.id, id)).limit(1);
  if (!row) throw new NotFoundError('Service point not found');
  return row as ServicePoint;
}

async function createServicePoint(input: CreateServicePointInput): Promise<ServicePoint> {
  const db = getDb();
  const [row] = await db
    .insert(servicePoints)
    .values({ ...input, location: derivarCoordenadas(input.location) })
    .returning();
  return row as ServicePoint;
}

async function updateServicePoint(
  id: string,
  input: UpdateServicePointInput
): Promise<ServicePoint> {
  await getServicePointById(id);
  const db = getDb();
  const [row] = await db
    .update(servicePoints)
    .set({
      ...input,
      /* `undefined` no toca la columna; solo se recalcula si vino `location`. */
      location: derivarCoordenadas(input.location),
      updatedAt: new Date(),
    })
    .where(eq(servicePoints.id, id))
    .returning();
  return row as ServicePoint;
}

/** A la papelera, no al vacío. */
async function trashServicePoint(id: string): Promise<boolean> {
  const actual = await getServicePointById(id);
  if (actual.deletedAt) return true;

  const db = getDb();
  await db
    .update(servicePoints)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(servicePoints.id, id))
    .returning();
  return true;
}

async function restoreServicePoint(id: string): Promise<ServicePoint> {
  await getServicePointById(id);
  const db = getDb();
  const [row] = await db
    .update(servicePoints)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(servicePoints.id, id))
    .returning();
  return row as ServicePoint;
}

/** Definitivo. Solo desde la papelera: hay que decidirlo dos veces. */
async function purgeServicePoint(id: string): Promise<boolean> {
  const actual = await getServicePointById(id);
  if (!actual.deletedAt) {
    throw new BadRequestError(
      'Antes de eliminar definitivamente hay que mandar el punto de atención a la papelera.'
    );
  }

  const db = getDb();
  await db.delete(servicePoints).where(eq(servicePoints.id, id));
  return true;
}

export const servicePointService = {
  listServicePoints,
  getServicePointBySlug,
  getServicePointById,
  createServicePoint,
  updateServicePoint,
  /** Nombre viejo del patrón, comportamiento nuevo: manda a la papelera. */
  deleteServicePoint: trashServicePoint,
  trashServicePoint,
  restoreServicePoint,
  purgeServicePoint,
};
