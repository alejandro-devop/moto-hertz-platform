import { z } from 'zod';

/**
 * Catálogo cerrado de tipos. Agregar un valor toca aquí, en
 * `types/services/service-point.types.ts`, en el `enum ServicePointType` del
 * SDL y en `ETIQUETAS_TIPO` del panel.
 */
const servicePointTypeSchema = z.enum(['SEDE', 'CONCESIONARIO', 'DISTRIBUIDOR']);

const addressSchema = z
  .object({
    street: z.string().max(255).optional(),
    neighborhood: z.string().max(120).optional(),
    city: z.string().max(120).optional(),
    state: z.string().max(120).optional(),
  })
  .optional();

/**
 * La ubicación se pega como enlace de Google Maps. `lat`/`lng` **no se aceptan
 * de afuera**: los extrae el service del propio enlace
 * (`shared/geo/maps-url.ts`), así no hay forma de guardar unas coordenadas que
 * no correspondan al enlace que se muestra.
 */
const locationSchema = z
  .object({
    mapsUrl: z
      .string()
      .trim()
      .max(2000)
      .refine(
        (value) => value === '' || /^https?:\/\//i.test(value),
        'El enlace del mapa tiene que empezar por http:// o https://'
      )
      .optional(),
  })
  .optional();

/** `"09:15"` en 24 h. El editor del panel usa `<input type="time">`. */
const horaSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora va en formato HH:MM de 24 horas');

const diaSchema = z
  .object({
    open: horaSchema,
    close: horaSchema,
  })
  .optional();

/**
 * Horario semanal. **Un día ausente está cerrado**: no hay bandera `closed`,
 * para que no existan dos formas de decir lo mismo.
 */
const hoursSchema = z
  .object({
    monday: diaSchema,
    tuesday: diaSchema,
    wednesday: diaSchema,
    thursday: diaSchema,
    friday: diaSchema,
    saturday: diaSchema,
    sunday: diaSchema,
  })
  .optional();

export const servicePointSlugArgSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const servicePointIdArgSchema = z.object({
  id: z.string().uuid('Invalid service point ID'),
});

export const servicePointsListArgsSchema = z.object({
  type: servicePointTypeSchema.optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  trashed: z.boolean().optional(),
});

export const servicePointAddInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug va en minúsculas, números y guiones simples'),
  name: z.string().min(1).max(255),
  type: servicePointTypeSchema,
  address: addressSchema,
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(50).optional(),
  email: z.string().email('Correo inválido').max(255).optional(),
  location: locationSchema,
  hours: hoursSchema,
});

export const servicePointEditInputSchema = z
  .object({
    id: z.string().uuid('Invalid service point ID'),
    slug: z
      .string()
      .min(1)
      .max(255)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug va en minúsculas, números y guiones simples')
      .optional(),
    name: z.string().min(1).max(255).optional(),
    type: servicePointTypeSchema.optional(),
    address: addressSchema,
    phone: z.string().max(50).optional(),
    whatsapp: z.string().max(50).optional(),
    email: z.string().email('Correo inválido').max(255).optional(),
    location: locationSchema,
    hours: hoursSchema,
  })
  .refine((d) => Object.keys(d).some((k) => k !== 'id' && (d as any)[k] !== undefined), {
    message: 'At least one field is required to update',
  });
