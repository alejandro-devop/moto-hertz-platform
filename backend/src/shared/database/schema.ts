import { pgTable, uuid, integer, varchar, decimal, boolean, timestamp, text, jsonb } from 'drizzle-orm/pg-core';
import { generateUuidV7 } from './uuid';
import type {
  MotorcycleEngine,
  MotorcycleImages,
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
  year: integer('year'),
  price: decimal('price', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('COP'),
  description: text('description'),
  fullDescription: text('full_description'),
  engine: jsonb('engine').$type<MotorcycleEngine>(),
  features: jsonb('features').$type<string[]>().default([]),
  colors: jsonb('colors').$type<string[]>().default([]),
  images: jsonb('images').$type<MotorcycleImages>(),
  specs: jsonb('specs').$type<MotorcycleSpecs>(),
  available: boolean('available').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
});
