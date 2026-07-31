import { serviceService } from '../../../services/service.service';
import { withValidatedResolver } from '../../utils/validation';
import { requireAuth } from '../../utils/error-handler';
import {
  serviceAddInputSchema,
  serviceEditInputSchema,
  serviceIdArgSchema,
  serviceSlugArgSchema,
  servicesListArgsSchema,
} from '../../../validators/schemas/service.schemas';
import type { Service } from '../../../types/services/service.types';

/**
 * Lectura pública (la página `/servicios` del sitio la consume sin sesión);
 * toda mutación exige admin autenticado vía `requireAuth`.
 */
export const serviceResolvers = {
  /* Las columnas jsonb pueden ser `null` en filas viejas, pero el SDL promete
     listas: se normalizan aquí en vez de obligar a cada consumidor a hacerlo. */
  Service: {
    features: (service: Service) => service.features ?? [],
    benefits: (service: Service) => service.benefits ?? [],
  },

  Query: {
    service: withValidatedResolver(
      serviceSlugArgSchema,
      async (_: unknown, { slug }: { slug: string }) => {
        return serviceService.getServiceBySlug(slug);
      },
      'service'
    ),

    services: withValidatedResolver(
      servicesListArgsSchema,
      async (_: unknown, args: Record<string, unknown>) => {
        return serviceService.listServices(args as any);
      },
      'services'
    ),
  },

  Mutation: {
    serviceAdd: withValidatedResolver(
      serviceAddInputSchema,
      async (_: unknown, { input }: { input: any }, context) => {
        requireAuth(context, 'serviceAdd');
        return serviceService.createService(input);
      },
      'serviceAdd'
    ),

    serviceEdit: withValidatedResolver(
      serviceEditInputSchema,
      async (_: unknown, { input }: { input: any }, context) => {
        requireAuth(context, 'serviceEdit');
        const { id, ...rest } = input;
        return serviceService.updateService(id, rest);
      },
      'serviceEdit'
    ),

    serviceRemove: withValidatedResolver(
      serviceIdArgSchema,
      async (_: unknown, { id }: { id: string }, context) => {
        requireAuth(context, 'serviceRemove');
        return serviceService.trashService(id);
      },
      'serviceRemove'
    ),

    serviceRestore: withValidatedResolver(
      serviceIdArgSchema,
      async (_: unknown, { id }: { id: string }, context) => {
        requireAuth(context, 'serviceRestore');
        return serviceService.restoreService(id);
      },
      'serviceRestore'
    ),

    servicePurge: withValidatedResolver(
      serviceIdArgSchema,
      async (_: unknown, { id }: { id: string }, context) => {
        requireAuth(context, 'servicePurge');
        return serviceService.purgeService(id);
      },
      'servicePurge'
    ),
  },
};
