import { z } from 'zod';

export const pageContentArgsSchema = z.object({
  page: z.string().trim().min(1).max(100),
});

export const pageContentSetManyArgsSchema = z.object({
  page: z.string().trim().min(1).max(100),
  fields: z
    .array(
      z.object({
        field: z.string().trim().min(1).max(100),
        value: z.string().max(5000),
      })
    )
    .min(1, 'Hay que mandar al menos un campo.')
    .max(50),
});
