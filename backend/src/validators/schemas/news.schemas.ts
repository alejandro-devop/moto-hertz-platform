import { z } from 'zod';

const slugSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug va en minúsculas, números y guiones simples');

/**
 * Un renglón de `tags`. Los renglones en blanco **se descartan en vez de
 * rechazarse**, igual que `features`/`benefits` de `service`: quien está
 * escribiendo una lista deja huecos mientras piensa.
 */
const tagsSchema = z
  .array(z.string().max(60))
  .max(20)
  .transform((items) => items.map((item) => item.trim()).filter((item) => item.length > 0))
  .optional();

/**
 * El contenido llega como HTML del editor enriquecido del panel (Tiptap). No
 * se valida su forma aquí más allá del tamaño: quien lo sanea de verdad —
 * quitando cualquier etiqueta que no sea de las permitidas— es
 * `news.service.ts`, porque la lista de etiquetas permitidas es una decisión
 * de dominio, no de transporte.
 */
const contentSchema = z.string().max(50_000).optional();

export const newsSlugArgSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const newsIdArgSchema = z.object({
  id: z.string().uuid('Invalid news ID'),
});

export const newsListArgsSchema = z.object({
  /** Texto libre: la categoría no es un catálogo cerrado (ver los tipos). */
  category: z.string().max(100).optional(),
  featured: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  trashed: z.boolean().optional(),
});

export const newsAddInputSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(500),
  excerpt: z.string().max(500).optional(),
  content: contentSchema,
  author: z.string().max(255).optional(),
  category: z.string().max(100).optional(),
  /** Ausente o `null` = borrador. Ver la regla en `news.service.ts`. */
  publishedAt: z.coerce.date().nullable().optional(),
  featured: z.boolean().optional(),
  tags: tagsSchema,
  image: z.string().max(2000).optional(),
  readTime: z.string().max(20).optional(),
});

export const newsEditInputSchema = z
  .object({
    id: z.string().uuid('Invalid news ID'),
    slug: slugSchema.optional(),
    title: z.string().min(1).max(500).optional(),
    excerpt: z.string().max(500).optional(),
    content: contentSchema,
    author: z.string().max(255).optional(),
    category: z.string().max(100).optional(),
    publishedAt: z.coerce.date().nullable().optional(),
    featured: z.boolean().optional(),
    tags: tagsSchema,
    image: z.string().max(2000).optional(),
    readTime: z.string().max(20).optional(),
  })
  .refine((d) => Object.keys(d).some((k) => k !== 'id' && (d as any)[k] !== undefined), {
    message: 'At least one field is required to update',
  });
