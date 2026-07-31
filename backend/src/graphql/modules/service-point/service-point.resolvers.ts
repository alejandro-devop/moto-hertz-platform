import { servicePointService } from '../../../services/service-point.service';
import { withValidatedResolver } from '../../utils/validation';
import { requireAuth } from '../../utils/error-handler';
import {
  servicePointAddInputSchema,
  servicePointEditInputSchema,
  servicePointIdArgSchema,
  servicePointSlugArgSchema,
  servicePointsListArgsSchema,
} from '../../../validators/schemas/service-point.schemas';

/**
 * Lectura pública (la página `/puntos-atencion` del sitio la consume sin
 * sesión); toda mutación exige admin autenticado vía `requireAuth`.
 */
export const servicePointResolvers = {
  Query: {
    servicePoint: withValidatedResolver(
      servicePointSlugArgSchema,
      async (_: unknown, { slug }: { slug: string }) => {
        return servicePointService.getServicePointBySlug(slug);
      },
      'servicePoint'
    ),

    servicePoints: withValidatedResolver(
      servicePointsListArgsSchema,
      async (_: unknown, args: Record<string, unknown>) => {
        return servicePointService.listServicePoints(args as any);
      },
      'servicePoints'
    ),
  },

  Mutation: {
    servicePointAdd: withValidatedResolver(
      servicePointAddInputSchema,
      async (_: unknown, { input }: { input: any }, context) => {
        requireAuth(context, 'servicePointAdd');
        return servicePointService.createServicePoint(input);
      },
      'servicePointAdd'
    ),

    servicePointEdit: withValidatedResolver(
      servicePointEditInputSchema,
      async (_: unknown, { input }: { input: any }, context) => {
        requireAuth(context, 'servicePointEdit');
        const { id, ...rest } = input;
        return servicePointService.updateServicePoint(id, rest);
      },
      'servicePointEdit'
    ),

    servicePointRemove: withValidatedResolver(
      servicePointIdArgSchema,
      async (_: unknown, { id }: { id: string }, context) => {
        requireAuth(context, 'servicePointRemove');
        return servicePointService.trashServicePoint(id);
      },
      'servicePointRemove'
    ),

    servicePointRestore: withValidatedResolver(
      servicePointIdArgSchema,
      async (_: unknown, { id }: { id: string }, context) => {
        requireAuth(context, 'servicePointRestore');
        return servicePointService.restoreServicePoint(id);
      },
      'servicePointRestore'
    ),

    servicePointPurge: withValidatedResolver(
      servicePointIdArgSchema,
      async (_: unknown, { id }: { id: string }, context) => {
        requireAuth(context, 'servicePointPurge');
        return servicePointService.purgeServicePoint(id);
      },
      'servicePointPurge'
    ),
  },
};
