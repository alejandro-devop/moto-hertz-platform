import { z } from 'zod';

/**
 * Lo que llega de afuera en el dominio `tour`. El `userId` **no** está aquí a
 * propósito: no viaja desde el cliente, lo pone el resolver desde el JWT.
 */

/** Mismo formato que las claves del registro de tours del panel: `motos.lista`. */
const tourKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(\.[a-z0-9-]+)*$/, 'La clave del recorrido va en minúsculas, separada por puntos.');

export const tourSeenArgsSchema = z.object({
  key: tourKeySchema,
  /* `SMALLINT` en la base; el tope evita que un cliente mande algo que no cabe. */
  version: z.number().int().min(1).max(32767),
  status: z.enum(['completed', 'skipped']),
});

export const tourResetArgsSchema = z.object({
  /* Sin clave = reiniciar todos los recorridos del usuario. */
  key: tourKeySchema.optional().nullable(),
});
