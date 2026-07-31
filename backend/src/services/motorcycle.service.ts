import { and, count, desc, eq, isNotNull, isNull, SQL } from 'drizzle-orm';
import { getDb } from '../shared/database/drizzle';
import { motorcycles } from '../shared/database/schema';
import { BadRequestError, NotFoundError } from '../shared/errors';
import type {
  CreateMotorcycleInput,
  ListMotorcyclesOptions,
  Motorcycle,
  MotorcycleCollection,
  UpdateMotorcycleInput,
} from '../types/services/motorcycle.types';

function buildFilters(options: ListMotorcyclesOptions): SQL | undefined {
  /* Papelera: toda lectura la excluye salvo que se pida explícitamente.
     Ver «Soft delete» en `docs/cms-plan/PATRON.md`. */
  const conditions: SQL[] = [
    options.trashed ? isNotNull(motorcycles.deletedAt) : isNull(motorcycles.deletedAt),
  ];

  if (options.category) {
    conditions.push(eq(motorcycles.category, options.category));
  }
  if (options.brand) {
    conditions.push(eq(motorcycles.brand, options.brand));
  }
  if (options.condition) {
    conditions.push(eq(motorcycles.condition, options.condition));
  }
  if (options.featured !== undefined) {
    conditions.push(eq(motorcycles.featured, options.featured));
  }
  if (options.available !== undefined) {
    conditions.push(eq(motorcycles.available, options.available));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

async function listMotorcycles(options: ListMotorcyclesOptions = {}): Promise<MotorcycleCollection> {
  const db = getDb();
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const offset = (page - 1) * limit;
  const where = buildFilters(options);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(motorcycles)
      .where(where)
      .orderBy(desc(motorcycles.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(motorcycles).where(where),
  ]);

  return {
    motorcycles: rows as Motorcycle[],
    page,
    limit,
    total,
  };
}

/** El sitio público consulta por slug: una moto en la papelera no existe. */
async function getMotorcycleBySlug(slug: string): Promise<Motorcycle> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(motorcycles)
    .where(and(eq(motorcycles.slug, slug), isNull(motorcycles.deletedAt)))
    .limit(1);
  if (!row) throw new NotFoundError('Motorcycle not found');
  return row as Motorcycle;
}

/**
 * Por id **sí alcanza la papelera**: restaurar y eliminar definitivamente
 * trabajan justamente sobre registros borrados.
 */
async function getMotorcycleById(id: string): Promise<Motorcycle> {
  const db = getDb();
  const [row] = await db.select().from(motorcycles).where(eq(motorcycles.id, id)).limit(1);
  if (!row) throw new NotFoundError('Motorcycle not found');
  return row as Motorcycle;
}

async function createMotorcycle(input: CreateMotorcycleInput): Promise<Motorcycle> {
  const db = getDb();
  const [row] = await db.insert(motorcycles).values(input).returning();
  return row as Motorcycle;
}

async function updateMotorcycle(id: string, input: UpdateMotorcycleInput): Promise<Motorcycle> {
  await getMotorcycleById(id);
  const db = getDb();
  const [row] = await db
    .update(motorcycles)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(motorcycles.id, id))
    .returning();
  return row as Motorcycle;
}

/**
 * A la papelera, no al vacío. Sus fotos **no se tocan**: los archivos viven en
 * la biblioteca de medios y se borran solo desde ahí (decisión de la Fase 1).
 */
async function trashMotorcycle(id: string): Promise<boolean> {
  const actual = await getMotorcycleById(id);
  if (actual.deletedAt) return true;

  const db = getDb();
  await db
    .update(motorcycles)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(motorcycles.id, id))
    .returning();
  return true;
}

async function restoreMotorcycle(id: string): Promise<Motorcycle> {
  await getMotorcycleById(id);
  const db = getDb();
  const [row] = await db
    .update(motorcycles)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(motorcycles.id, id))
    .returning();
  return row as Motorcycle;
}

/** Definitivo. Solo desde la papelera: hay que decidirlo dos veces. */
async function purgeMotorcycle(id: string): Promise<boolean> {
  const actual = await getMotorcycleById(id);
  if (!actual.deletedAt) {
    throw new BadRequestError(
      'Antes de eliminar definitivamente hay que mandar la moto a la papelera.'
    );
  }

  const db = getDb();
  await db.delete(motorcycles).where(eq(motorcycles.id, id));
  return true;
}

export const motorcycleService = {
  listMotorcycles,
  getMotorcycleBySlug,
  getMotorcycleById,
  createMotorcycle,
  updateMotorcycle,
  /** Nombre viejo, comportamiento nuevo: manda a la papelera. */
  deleteMotorcycle: trashMotorcycle,
  trashMotorcycle,
  restoreMotorcycle,
  purgeMotorcycle,
};
