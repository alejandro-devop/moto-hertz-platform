import { z } from 'zod';

const urlSchema = z.string().trim().min(1).max(2000);

/** Catálogo cerrado: ver la nota de la migración `013`. */
const bannerSlotSchema = z.enum(['HOME', 'SECUNDARIO']);

/** Vigencia opcional: si llegan las dos, el fin no puede ser antes que el inicio. */
function vigenciaValida(d: { startsAt?: Date | null; endsAt?: Date | null }): boolean {
  if (!d.startsAt || !d.endsAt) return true;
  return d.startsAt <= d.endsAt;
}

export const bannerIdArgSchema = z.object({
  id: z.string().uuid('Invalid banner ID'),
});

export const bannersListArgsSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  slot: bannerSlotSchema.optional(),
  trashed: z.boolean().optional(),
});

export const bannerReorderArgsSchema = z.object({
  slot: bannerSlotSchema,
  ids: z.array(z.string().uuid()).min(1, 'La lista de orden no puede estar vacía'),
});

export const bannerAddInputSchema = z
  .object({
    title: z.string().trim().min(1, 'Ponle un título: es lo que se lee sobre la imagen.').max(255),
    subtitle: z.string().trim().max(500).optional(),
    image: urlSchema,
    imageMobile: urlSchema.optional(),
    link: z.string().trim().max(2000).optional(),
    linkLabel: z.string().trim().max(100).optional(),
    slot: bannerSlotSchema,
    active: z.boolean().optional(),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
  })
  .refine(vigenciaValida, {
    path: ['endsAt'],
    message: 'La fecha de fin no puede ser anterior a la de inicio.',
  });

export const bannerEditInputSchema = z
  .object({
    id: z.string().uuid('Invalid banner ID'),
    title: z.string().trim().min(1).max(255).optional(),
    subtitle: z.string().trim().max(500).optional(),
    image: urlSchema.optional(),
    imageMobile: urlSchema.optional(),
    link: z.string().trim().max(2000).optional(),
    linkLabel: z.string().trim().max(100).optional(),
    slot: bannerSlotSchema.optional(),
    active: z.boolean().optional(),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
  })
  .refine((d) => Object.keys(d).some((k) => k !== 'id' && (d as any)[k] !== undefined), {
    message: 'At least one field is required to update',
  })
  .refine(vigenciaValida, {
    path: ['endsAt'],
    message: 'La fecha de fin no puede ser anterior a la de inicio.',
  });
