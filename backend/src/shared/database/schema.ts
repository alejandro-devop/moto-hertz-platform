import {
  pgTable,
  uuid,
  integer,
  varchar,
  decimal,
  boolean,
  timestamp,
  text,
  jsonb,
} from 'drizzle-orm/pg-core';
import { generateUuidV7 } from './uuid';
import type {
  MotorcycleCommercial,
  MotorcycleCondition,
  MotorcycleEngine,
  MotorcycleImages,
  MotorcycleLocation,
  MotorcyclePaperwork,
  MotorcycleSpecs,
} from '../../types/services/motorcycle.types';

// ============================================
// MOTORCYCLES — catálogo de motos
// ============================================
export const motorcycles = pgTable('motorcycles', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => generateUuidV7()),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  brand: varchar('brand', { length: 100 }),
  condition: varchar('condition', { length: 10 })
    .$type<MotorcycleCondition>()
    .notNull()
    .default('NEW'),
  year: integer('year'),
  mileageKm: integer('mileage_km'),
  price: decimal('price', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('COP'),
  description: text('description'),
  fullDescription: text('full_description'),
  engine: jsonb('engine').$type<MotorcycleEngine>(),
  features: jsonb('features').$type<string[]>().default([]),
  colors: jsonb('colors').$type<string[]>().default([]),
  images: jsonb('images').$type<MotorcycleImages>(),
  specs: jsonb('specs').$type<MotorcycleSpecs>(),
  paperwork: jsonb('paperwork').$type<MotorcyclePaperwork>(),
  commercial: jsonb('commercial').$type<MotorcycleCommercial>(),
  location: jsonb('location').$type<MotorcycleLocation>(),
  available: boolean('available').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  /** Papelera: ver «Soft delete» en `docs/cms-plan/PATRON.md`. */
  deletedAt: timestamp('deleted_at'),
});

// ============================================
// SERVICE POINTS — puntos de atención/talleres
// ============================================
export const servicePoints = pgTable('service_points', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => generateUuidV7()),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }),
  address: jsonb('address').$type<Record<string, string>>(),
  phone: varchar('phone', { length: 50 }),
  whatsapp: varchar('whatsapp', { length: 50 }),
  email: varchar('email', { length: 255 }),
  location: jsonb('location').$type<{ lat: number; lng: number }>(),
  hours: jsonb('hours').$type<Record<string, string>>(),
  services: jsonb('services').$type<string[]>().default([]),
  featured: boolean('featured').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ============================================
// SERVICES — servicios ofrecidos (mantenimiento, garantía, etc.)
// ============================================
export const services = pgTable('services', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => generateUuidV7()),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  shortDescription: text('short_description'),
  fullDescription: text('full_description'),
  icon: varchar('icon', { length: 10 }),
  features: jsonb('features').$type<string[]>().default([]),
  benefits: jsonb('benefits').$type<string[]>().default([]),
  pricing: jsonb('pricing').$type<{ from: number; currency: string; frequency: string }>(),
  duration: varchar('duration', { length: 100 }),
  featured: boolean('featured').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ============================================
// NEWS — noticias
// ============================================
export const news = pgTable('news', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => generateUuidV7()),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  excerpt: text('excerpt'),
  content: text('content'),
  author: jsonb('author').$type<{ name: string; avatar?: string }>(),
  category: varchar('category', { length: 100 }),
  publishedAt: timestamp('published_at').notNull().defaultNow(),
  featured: boolean('featured').notNull().default(false),
  tags: jsonb('tags').$type<string[]>().default([]),
  image: jsonb('image').$type<{ main: string; thumbnail?: string; alt?: string }>(),
  readTime: varchar('read_time', { length: 20 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ============================================
// MEDIA — biblioteca de archivos subidos desde el panel
// ============================================
/**
 * Un registro por archivo guardado. Existe por la papelera: sin tabla no hay
 * forma de listar lo borrado ni de saber qué archivo hay que quitar del
 * almacenamiento al eliminar definitivamente.
 *
 * `key` es la ruta dentro del driver de almacenamiento; `url` es la URL pública
 * tal como quedó guardada en el contenido el día de la subida. Se guardan las
 * dos: si cambia el dominio o el driver, `key` permite rearmar `url`.
 */
export const media = pgTable('media', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => generateUuidV7()),
  key: varchar('key', { length: 500 }).notNull().unique(),
  url: text('url').notNull(),
  /** Qué driver la guardó (`local`, y mañana `s3`/`gcs`). */
  driver: varchar('driver', { length: 20 }).notNull().default('local'),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  /** El nombre del archivo original, solo para reconocerlo en la biblioteca. */
  originalName: varchar('original_name', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});
