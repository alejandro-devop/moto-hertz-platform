import { z } from 'zod';

export const mediaIdArgSchema = z.object({
  id: z.string().uuid('Invalid media ID'),
});

export const mediaListArgsSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(200).optional(),
  q: z.string().max(255).optional(),
  /** `true` = solo la papelera. */
  trashed: z.boolean().optional(),
});
