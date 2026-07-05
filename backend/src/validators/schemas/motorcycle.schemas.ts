import { z } from 'zod';

const engineSchema = z
  .object({
    type: z.string().optional(),
    displacement: z.string().optional(),
    power: z.string().optional(),
    torque: z.string().optional(),
  })
  .optional();

const imagesSchema = z
  .object({
    main: z.string().url(),
    gallery: z.array(z.string().url()).default([]),
  })
  .optional();

const specsSchema = z
  .object({
    weight: z.string().optional(),
    seatHeight: z.string().optional(),
    fuelCapacity: z.string().optional(),
    transmission: z.string().optional(),
  })
  .optional();

export const motorcycleSlugArgSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const motorcycleIdArgSchema = z.object({
  id: z.string().uuid('Invalid motorcycle ID'),
});

export const motorcyclesListArgsSchema = z.object({
  category: z.string().optional(),
  featured: z.boolean().optional(),
  available: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const motorcycleAddInputSchema = z.object({
  slug: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  category: z.string().max(100).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  price: z.string().optional(),
  currency: z.string().length(3).optional(),
  description: z.string().optional(),
  fullDescription: z.string().optional(),
  engine: engineSchema,
  features: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  images: imagesSchema,
  specs: specsSchema,
  available: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const motorcycleEditInputSchema = z
  .object({
    id: z.string().uuid('Invalid motorcycle ID'),
    slug: z.string().min(1).max(255).optional(),
    name: z.string().min(1).max(255).optional(),
    category: z.string().max(100).optional(),
    year: z.number().int().min(1900).max(2100).optional(),
    price: z.string().optional(),
    currency: z.string().length(3).optional(),
    description: z.string().optional(),
    fullDescription: z.string().optional(),
    engine: engineSchema,
    features: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),
    images: imagesSchema,
    specs: specsSchema,
    available: z.boolean().optional(),
    featured: z.boolean().optional(),
  })
  .refine(
    (d) => Object.keys(d).some((k) => k !== 'id' && (d as any)[k] !== undefined),
    { message: 'At least one field is required to update' }
  );
