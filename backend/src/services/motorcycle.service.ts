import { and, count, desc, eq, SQL } from 'drizzle-orm';
import { getDb } from '../shared/database/drizzle';
import { motorcycles } from '../shared/database/schema';
import { NotFoundError } from '../shared/errors';
import type {
  CreateMotorcycleInput,
  ListMotorcyclesOptions,
  Motorcycle,
  MotorcycleCollection,
  UpdateMotorcycleInput,
} from '../types/services/motorcycle.types';

function buildFilters(options: ListMotorcyclesOptions): SQL | undefined {
  const conditions: SQL[] = [];

  if (options.category) {
    conditions.push(eq(motorcycles.category, options.category));
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

async function getMotorcycleBySlug(slug: string): Promise<Motorcycle> {
  const db = getDb();
  const [row] = await db.select().from(motorcycles).where(eq(motorcycles.slug, slug)).limit(1);
  if (!row) throw new NotFoundError('Motorcycle not found');
  return row as Motorcycle;
}

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

async function deleteMotorcycle(id: string): Promise<boolean> {
  await getMotorcycleById(id);
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
  deleteMotorcycle,
};
