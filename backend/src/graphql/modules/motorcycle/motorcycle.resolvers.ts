import { motorcycleService } from '../../../services/motorcycle.service';
import { withValidatedResolver } from '../../utils/validation';
import {
  motorcycleAddInputSchema,
  motorcycleEditInputSchema,
  motorcycleIdArgSchema,
  motorcycleSlugArgSchema,
  motorcyclesListArgsSchema,
} from '../../../validators/schemas/motorcycle.schemas';

/**
 * Query/lectura pública (catálogo consumido por `web`). Las mutaciones
 * quedan sin `requireAuth` porque en esta fase no existe aún cms-admin ni
 * su capa de autenticación (ver Fase 3/4) — se añadirá `requireAuth` a las
 * mutaciones una vez exista un admin autenticado que las use.
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
      async (_: unknown, { input }: { input: any }) => {
        return motorcycleService.createMotorcycle(input);
      },
      'motorcycleAdd'
    ),

    motorcycleEdit: withValidatedResolver(
      motorcycleEditInputSchema,
      async (_: unknown, { input }: { input: any }) => {
        const { id, ...rest } = input;
        return motorcycleService.updateMotorcycle(id, rest);
      },
      'motorcycleEdit'
    ),

    motorcycleRemove: withValidatedResolver(
      motorcycleIdArgSchema,
      async (_: unknown, { id }: { id: string }) => {
        return motorcycleService.deleteMotorcycle(id);
      },
      'motorcycleRemove'
    ),
  },
};
