import { and, asc, count, eq, isNotNull, isNull, SQL } from 'drizzle-orm';
import { getDb } from '../shared/database/drizzle';
import { services } from '../shared/database/schema';
import { BadRequestError, NotFoundError } from '../shared/errors';
import type {
  CreateServiceInput,
  ListServicesOptions,
  Service,
  ServiceCollection,
  ServicePricing,
  UpdateServiceInput,
} from '../types/services/service.types';

function buildFilters(options: ListServicesOptions): SQL | undefined {
  /* Papelera: toda lectura la excluye salvo que se pida explícitamente.
     Ver «Soft delete» en `docs/cms-plan/PATRON.md` §1.1. */
  const conditions: SQL[] = [
    options.trashed ? isNotNull(services.deletedAt) : isNull(services.deletedAt),
  ];

  if (options.category) {
    conditions.push(eq(services.category, options.category));
  }

  if (options.featured !== undefined) {
    conditions.push(eq(services.featured, options.featured));
  }

  return and(...conditions);
}

/**
 * El precio se normaliza al guardar, no al leer, para que en la base no queden
 * dos formas de decir lo mismo:
 *
 * - `A_CONVENIR` **nunca lleva monto**: si venía uno, se descarta.
 * - `currency` es siempre `COP`; llegue lo que llegue.
 * - Una nota en blanco no se guarda.
 */
function normalizarPrecio(pricing?: ServicePricing | null): ServicePricing | undefined {
  if (pricing === undefined) return undefined;
  if (pricing === null) return { mode: 'A_CONVENIR', currency: 'COP' };

  const note = pricing.note?.trim();
  return {
    mode: pricing.mode,
    ...(pricing.mode === 'A_CONVENIR' ? {} : { amount: pricing.amount }),
    currency: 'COP',
    ...(note ? { note } : {}),
  };
}

/** Las listas viajan sin huecos: un renglón vacío no es un `feature`. */
function limpiarLista(lista?: string[]): string[] | undefined {
  if (lista === undefined) return undefined;
  return lista.map((item) => item.trim()).filter((item) => item.length > 0);
}

async function listServices(options: ListServicesOptions = {}): Promise<ServiceCollection> {
  const db = getDb();
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;
  const offset = (page - 1) * limit;
  const where = buildFilters(options);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(services)
      .where(where)
      /* Alfabético, como los puntos de atención: son pocos y fijos, y así se
         busca uno concreto sin depender de cuándo se creó. */
      .orderBy(asc(services.name))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(services).where(where),
  ]);

  return {
    services: rows as Service[],
    page,
    limit,
    total,
  };
}

/** El sitio público consulta por slug: un servicio en la papelera no existe. */
async function getServiceBySlug(slug: string): Promise<Service> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(services)
    .where(and(eq(services.slug, slug), isNull(services.deletedAt)))
    .limit(1);
  if (!row) throw new NotFoundError('Service not found');
  return row as Service;
}

/**
 * Por id **sí alcanza la papelera**: restaurar y eliminar definitivamente
 * trabajan justamente sobre registros borrados.
 */
async function getServiceById(id: string): Promise<Service> {
  const db = getDb();
  const [row] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  if (!row) throw new NotFoundError('Service not found');
  return row as Service;
}

async function createService(input: CreateServiceInput): Promise<Service> {
  const db = getDb();
  const [row] = await db
    .insert(services)
    .values({
      ...input,
      features: limpiarLista(input.features),
      benefits: limpiarLista(input.benefits),
      pricing: normalizarPrecio(input.pricing),
    })
    .returning();
  return row as Service;
}

async function updateService(id: string, input: UpdateServiceInput): Promise<Service> {
  await getServiceById(id);
  const db = getDb();
  const [row] = await db
    .update(services)
    .set({
      ...input,
      /* `undefined` no toca la columna: solo se reescribe lo que vino. */
      features: limpiarLista(input.features),
      benefits: limpiarLista(input.benefits),
      pricing: normalizarPrecio(input.pricing),
      updatedAt: new Date(),
    })
    .where(eq(services.id, id))
    .returning();
  return row as Service;
}

/** A la papelera, no al vacío. */
async function trashService(id: string): Promise<boolean> {
  const actual = await getServiceById(id);
  if (actual.deletedAt) return true;

  const db = getDb();
  await db
    .update(services)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(services.id, id))
    .returning();
  return true;
}

async function restoreService(id: string): Promise<Service> {
  await getServiceById(id);
  const db = getDb();
  const [row] = await db
    .update(services)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(services.id, id))
    .returning();
  return row as Service;
}

/** Definitivo. Solo desde la papelera: hay que decidirlo dos veces. */
async function purgeService(id: string): Promise<boolean> {
  const actual = await getServiceById(id);
  if (!actual.deletedAt) {
    throw new BadRequestError(
      'Antes de eliminar definitivamente hay que mandar el servicio a la papelera.'
    );
  }

  const db = getDb();
  await db.delete(services).where(eq(services.id, id));
  return true;
}

export const serviceService = {
  listServices,
  getServiceBySlug,
  getServiceById,
  createService,
  updateService,
  /** Nombre viejo del patrón, comportamiento nuevo: manda a la papelera. */
  deleteService: trashService,
  trashService,
  restoreService,
  purgeService,
};
