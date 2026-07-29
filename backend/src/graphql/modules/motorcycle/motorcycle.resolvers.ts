import { motorcycleService } from '../../../services/motorcycle.service';
import { withValidatedResolver } from '../../utils/validation';
import { requireAuth } from '../../utils/error-handler';
import {
  motorcycleAddInputSchema,
  motorcycleEditInputSchema,
  motorcycleIdArgSchema,
  motorcycleSlugArgSchema,
  motorcyclesListArgsSchema,
} from '../../../validators/schemas/motorcycle.schemas';

/**
 * Query/lectura pública (catálogo consumido por `web`). Las mutaciones
 * requieren un admin autenticado (JWT emitido por `login`, ver
 * `cms-admin`) vía `requireAuth`.
 */
export const motorcycleResolvers = {
  Query: {
    motorcycle: withValidatedResolver(
      motorcycleSlugArgSchema,
      async (_: unknown, { slug }: { slug: string }) => {
        return motorcycleService.getMotorcycleBySlug(slug);
      },
      'motorcycle'
    ),

    motorcycles: withValidatedResolver(
      motorcyclesListArgsSchema,
      async (_: unknown, args: Record<string, unknown>) => {
        return motorcycleService.listMotorcycles(args as any);
      },
      'motorcycles'
    ),
  },

  Mutation: {
    motorcycleAdd: withValidatedResolver(
      motorcycleAddInputSchema,
      async (_: unknown, { input }: { input: any }, context) => {
        requireAuth(context, 'motorcycleAdd');
        return motorcycleService.createMotorcycle(input);
      },
      'motorcycleAdd'
    ),

    motorcycleEdit: withValidatedResolver(
      motorcycleEditInputSchema,
      async (_: unknown, { input }: { input: any }, context) => {
        requireAuth(context, 'motorcycleEdit');
        const { id, ...rest } = input;
        return motorcycleService.updateMotorcycle(id, rest);
      },
      'motorcycleEdit'
    ),

    motorcycleRemove: withValidatedResolver(
      motorcycleIdArgSchema,
      async (_: unknown, { id }: { id: string }, context) => {
        requireAuth(context, 'motorcycleRemove');
        return motorcycleService.deleteMotorcycle(id);
      },
      'motorcycleRemove'
    ),
  },
};
