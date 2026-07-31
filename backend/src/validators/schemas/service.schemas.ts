import { z } from 'zod';

/**
 * Las tres modalidades de precio acordadas con el usuario (Fase 3 del plan
 * CMS). Agregar una toca aquí, en `types/services/service.types.ts`, en el
 * `enum ServicePricingMode` del SDL y en las etiquetas del panel.
 */
const pricingModeSchema = z.enum(['DESDE', 'FIJO', 'A_CONVENIR']);

/**
 * El precio de un servicio.
 *
 * La regla que hace falta escribir aquí y no en el tipo es la relación entre
 * `mode` y `amount`: **`DESDE` y `FIJO` exigen monto, `A_CONVENIR` lo
 * prohíbe**. Sin eso se podría guardar «a convenir: $150.000», que es una
 * contradicción que el sitio no sabría pintar.
 *
 * `currency` no se acepta de afuera: el taller cobra en pesos y el service lo
 * fija en `COP`.
 */
const pricingSchema = z
  .object({
    mode: pricingModeSchema,
    amount: z.number().positive('El monto tiene que ser mayor que cero').max(1_000_000_000).optional(),
    note: z.string().trim().max(120).optional(),
  })
  .superRefine((value, ctx) => {
    /* Falta el monto en una modalidad que lo necesita: eso sí se rechaza, es
       un dato que no se puede inventar. */
    if (value.mode !== 'A_CONVENIR' && (value.amount === undefined || value.amount === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amount'],
        message: 'Falta el monto: sin él no se puede publicar un precio desde ni fijo',
      });
    }
  })
  /* Un monto que sobra **se descarta, no se rechaza**: la modalidad es lo que
     el usuario eligió a propósito, y el monto es lo que quedó escrito de
     antes. El service normaliza igual (`normalizarPrecio`); las dos capas
     tienen que decir lo mismo. */
  .transform((value) => (value.mode === 'A_CONVENIR' ? { ...value, amount: undefined } : value))
  .optional();

/**
 * Un renglón de `features` o `benefits`. Los renglones en blanco **se
 * descartan en vez de rechazarse**: quien está escribiendo una lista deja
 * huecos mientras piensa, y perder el guardado entero por un renglón vacío
 * sería un castigo. Lo que sí se rechaza es un renglón de un párrafo.
 */
const listaSchema = z
  .array(z.string().max(200))
  .max(30)
  .transform((items) => items.map((item) => item.trim()).filter((item) => item.length > 0))
  .optional();

/**
 * El icono es el nombre de un icono de `lucide-react` en kebab-case. Se valida
 * la **forma**, no la pertenencia al catálogo: el catálogo vive en el panel y
 * en el sitio (`cms-admin/lib/service-icons.ts`), y un nombre desconocido cae
 * en el icono por defecto. Así, agregar un icono no obliga a tocar el backend.
 */
const iconSchema = z
  .string()
  .trim()
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El icono va en minúsculas y guiones, como `shield-check`')
  .optional();

const slugSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug va en minúsculas, números y guiones simples');

export const serviceSlugArgSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const serviceIdArgSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
});

export const servicesListArgsSchema = z.object({
  /** Texto libre: la categoría no es un catálogo cerrado (ver los tipos). */
  category: z.string().max(100).optional(),
  featured: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  trashed: z.boolean().optional(),
});

export const serviceAddInputSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(255),
  category: z.string().max(100).optional(),
  shortDescription: z.string().max(500).optional(),
  fullDescription: z.string().max(5000).optional(),
  icon: iconSchema,
  features: listaSchema,
  benefits: listaSchema,
  pricing: pricingSchema,
  duration: z.string().max(100).optional(),
  featured: z.boolean().optional(),
  image: z.string().max(2000).optional(),
});

export const serviceEditInputSchema = z
  .object({
    id: z.string().uuid('Invalid service ID'),
    slug: slugSchema.optional(),
    name: z.string().min(1).max(255).optional(),
    category: z.string().max(100).optional(),
    shortDescription: z.string().max(500).optional(),
    fullDescription: z.string().max(5000).optional(),
    icon: iconSchema,
    features: listaSchema,
    benefits: listaSchema,
    pricing: pricingSchema,
    duration: z.string().max(100).optional(),
    featured: z.boolean().optional(),
    image: z.string().max(2000).optional(),
  })
  .refine((d) => Object.keys(d).some((k) => k !== 'id' && (d as any)[k] !== undefined), {
    message: 'At least one field is required to update',
  });
