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
import type {
  ServicePointAddress,
  ServicePointHours,
  ServicePointLocation,
  ServicePointType,
} from '../../types/services/service-point.types';
import type { ServicePricing } from '../../types/services/service.types';

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
/**
 * `services`, `featured` e `image` **quedaron sin usar** en la Fase 2 del plan
 * CMS: el usuario descartó esos tres campos (venían de la plantilla Yamaha). Se
 * dejan en la tabla para no migrar por nada, pero no se exponen en GraphQL ni
 * se editan en el panel. Ver `../../types/services/service-point.types.ts`.
 */
export const servicePoints = pgTable('service_points', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => generateUuidV7()),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).$type<ServicePointType>().notNull().default('SEDE'),
  address: jsonb('address').$type<ServicePointAddress>(),
  phone: varchar('phone', { length: 50 }),
  whatsapp: varchar('whatsapp', { length: 50 }),
  email: varchar('email', { length: 255 }),
  location: jsonb('location').$type<ServicePointLocation>(),
  hours: jsonb('hours').$type<ServicePointHours>(),
  /** Sin usar (ver arriba). */
  services: jsonb('services').$type<string[]>().default([]),
  /** Sin usar (ver arriba). */
  featured: boolean('featured').notNull().default(false),
  /** Sin usar (ver arriba). */
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ============================================
// SERVICES — servicios ofrecidos (mantenimiento, garantía, etc.)
// ============================================
/**
 * `icon` guarda el **nombre de un icono de `lucide-react` en kebab-case**
 * (`wrench`, `shield-check`), no un emoji: la plantilla original guardaba
 * emojis y por eso la columna nacía en `VARCHAR(10)`. La migración `008` la
 * ensanchó a 60. Ver `../../types/services/service.types.ts`.
 */
export const services = pgTable('services', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => generateUuidV7()),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  shortDescription: text('short_description'),
  fullDescription: text('full_description'),
  icon: varchar('icon', { length: 60 }),
  features: jsonb('features').$type<string[]>().default([]),
  benefits: jsonb('benefits').$type<string[]>().default([]),
  /** Tres modalidades: `DESDE`, `FIJO`, `A_CONVENIR`. Ver `ServicePricing`. */
  pricing: jsonb('pricing').$type<ServicePricing>(),
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
/**
 * Migración `009` (Fase 4 del plan CMS) tocó tres columnas de la plantilla:
 *
 * - **`publishedAt` es opcional y sin valor por defecto.** La plantilla la
 *   dejaba `NOT NULL DEFAULT now()`, así que toda noticia nacía «publicada» y
 *   no había forma de guardar un borrador. Ahora **sin fecha = borrador**, una
 *   fecha futura = programada, y una fecha de hoy o pasada = publicada. El
 *   panel deriva ese estado (`cms-admin/lib/news-status.ts`); el backend solo
 *   guarda la fecha o su ausencia.
 * - **`author` es texto**, no `{ name, avatar }`. La plantilla traía un avatar
 *   por autor que nunca tuvo archivos reales (rutas `/assets/authors/*.jpg`
 *   que no existen), así que se simplificó al mismo criterio que ya se usó con
 *   `service-point` y `service`: no cargar una estructura que nadie va a
 *   llenar. Si algún día hace falta una foto de autor, se puede reintroducir.
 * - **`image` es texto**, no `{ main, thumbnail, alt }`. El pipeline de
 *   medios (Fase 1) ya normaliza toda foto subida a un único WebP de hasta
 *   1600 px; no genera una miniatura aparte, así que guardar `thumbnail` era
 *   guardar un campo que el panel nunca iba a poder llenar de verdad. Mismo
 *   campo que `service.image`.
 */
export const news = pgTable('news', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => generateUuidV7()),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  excerpt: text('excerpt'),
  /**
   * HTML generado por el editor enriquecido del panel (Tiptap), ya saneado
   * por `news.service` antes de guardarse. Ver «Editor de contenido» en
   * `backend/CLAUDE.md`.
   */
  content: text('content'),
  author: varchar('author', { length: 255 }),
  category: varchar('category', { length: 100 }),
  /** `NULL` = borrador. Ver la nota de la migración `009` arriba. */
  publishedAt: timestamp('published_at'),
  featured: boolean('featured').notNull().default(false),
  tags: jsonb('tags').$type<string[]>().default([]),
  image: text('image'),
  readTime: varchar('read_time', { length: 20 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ============================================
// HOME_BANNERS — carrusel de la portada
// ============================================
/**
 * Primera tabla nueva del plan CMS (Fase 5): las tres anteriores
 * (`service_points`, `services`, `news`) ya existían de la plantilla, esta no.
 *
 * Alcance mínimo acordado con el usuario: **solo el carrusel** es
 * administrable desde el panel. El segundo banner ancho («Financia tu próxima
 * Yamaha») y los títulos de las secciones de la home (`Servicios Yamaha`,
 * `Últimas Noticias`) quedan fijos en el código de `web`.
 *
 * `position` es el dato que ordena el carrusel: lo edita el panel (subir/bajar
 * o arrastrar) y un banner nuevo se agrega al final. Ver `banner.service.ts`.
 */
export const homeBanners = pgTable('home_banners', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => generateUuidV7()),
  title: varchar('title', { length: 255 }).notNull(),
  subtitle: text('subtitle'),
  image: text('image').notNull(),
  imageMobile: text('image_mobile'),
  link: text('link'),
  linkLabel: varchar('link_label', { length: 100 }),
  position: integer('position').notNull().default(0),
  active: boolean('active').notNull().default(true),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
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

// ============================================
// SITE_SETTINGS — configuración global del sitio (registro único)
// ============================================
/**
 * Fase 6 del plan CMS: contacto, redes sociales, SEO y el nombre del sitio,
 * sacados del código de `web`. **Registro único**: la migración `011` crea la
 * fila con `id = 1` (con un `CHECK` que impide cualquier otra), sembrada con
 * los valores que hoy están en el código — no hay `Add` ni `Remove`, solo
 * `siteSettingsEdit`. Ver `docs/cms-plan/phases/06-configuracion-sitio.md`.
 */
export const siteSettings = pgTable('site_settings', {
  id: integer('id').primaryKey().default(1),
  siteName: varchar('site_name', { length: 255 }).notNull().default('Yamaha Oriente'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  /** Campo nuevo: no existía configuración de WhatsApp a nivel de sitio antes de esta fase. */
  whatsapp: varchar('whatsapp', { length: 50 }),
  /** Dirección física global, texto libre (no reemplaza `service_points`, que administra cada sede). */
  address: text('address'),
  socialFacebook: text('social_facebook'),
  socialInstagram: text('social_instagram'),
  socialTwitter: text('social_twitter'),
  socialYoutube: text('social_youtube'),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: varchar('seo_description', { length: 500 }),
  seoKeywords: jsonb('seo_keywords').$type<string[]>().notNull().default([]),
  seoImage: text('seo_image'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// PAGE_CONTENT — contenido editorial suelto de una página (tabla genérica)
// ============================================
/**
 * Un pendiente de MEJORAS.md pedía un lugar para administrar textos como el
 * heading/caption de `/motos`, que hoy quedan quemados en el JSX de `web`.
 * En vez de una tabla por página (que pide una migración cada vez que se
 * agrega una página nueva), es `page` + `field` + `value`: quien sabe qué
 * campos tiene cada página es el código de `web`/`cms-admin`, no la base.
 * `(page, field)` es único — ver migración `012`.
 */
export const pageContent = pgTable('page_content', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => generateUuidV7()),
  page: varchar('page', { length: 100 }).notNull(),
  field: varchar('field', { length: 100 }).notNull(),
  value: text('value'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
