import { z } from 'zod';
import { tourService } from '../../../services/tour.service';
import { withValidatedResolver } from '../../utils/validation';
import { requireAuth } from '../../utils/error-handler';
import {
  tourResetArgsSchema,
  tourSeenArgsSchema,
} from '../../../validators/schemas/tour.schemas';
import type { TourStatus } from '../../../types/services/tour.types';
import type { GraphQLContext } from '../../server';

/** `tourProgress` no recibe argumentos: nada que validar más allá de la forma vacía. */
const sinArgumentosSchema = z.object({});

/**
 * El usuario del recorrido siempre sale del JWT, nunca de los argumentos: no
 * existe forma de leer ni de borrar el progreso de otra persona.
 *
 * El `id` del contexto es un `number` porque `getGraphQLContext` hace
 * `Number(payload.sub)` — con el admin único de hoy (`sub` = '1') da 1. Aquí
 * se vuelve a texto porque la columna es `VARCHAR`: cuando exista una tabla de
 * usuarios de verdad con ids UUID, ese `Number()` es lo que hay que arreglar
 * (anotado en `docs/cms-plan/MEJORAS.md`), y esta línea seguirá sirviendo.
 */
function usuarioDeLaSesion(context: GraphQLContext, operacion: string): string {
  requireAuth(context, operacion);
  return String(context.user!.id);
}

export const tourResolvers = {
  Query: {
    /* Excepción declarada al patrón: esta query NO es pública. */
    tourProgress: withValidatedResolver(
      sinArgumentosSchema,
      async (_: unknown, __: unknown, context: GraphQLContext) =>
        tourService.listTourProgress(usuarioDeLaSesion(context, 'tourProgress')),
      'tourProgress'
    ),
  },

  Mutation: {
    tourSeen: withValidatedResolver(
      tourSeenArgsSchema,
      async (
        _: unknown,
        args: { key: string; version: number; status: TourStatus },
        context: GraphQLContext
      ) =>
        tourService.markTourSeen({
          userId: usuarioDeLaSesion(context, 'tourSeen'),
          tourKey: args.key,
          version: args.version,
          status: args.status,
        }),
      'tourSeen'
    ),

    tourReset: withValidatedResolver(
      tourResetArgsSchema,
      async (_: unknown, args: { key?: string | null }, context: GraphQLContext) =>
        tourService.resetTourProgress({
          userId: usuarioDeLaSesion(context, 'tourReset'),
          tourKey: args.key ?? undefined,
        }),
      'tourReset'
    ),
  },
};
