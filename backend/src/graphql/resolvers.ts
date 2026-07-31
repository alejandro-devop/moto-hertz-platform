import { mergeResolvers } from '@graphql-tools/merge';
import { healthResolvers } from './modules/common/health.resolvers';
import { authResolvers } from './modules/auth/auth.resolvers';
import { motorcycleResolvers } from './modules/motorcycle/motorcycle.resolvers';
import { servicePointResolvers } from './modules/service-point/service-point.resolvers';
import { mediaResolvers } from './modules/media/media.resolvers';

// Nuevos dominios (service, news) siguen el mismo patrón que motorcycle:
// agregar su <domain>.resolvers.ts aquí.
export const resolvers: any = mergeResolvers([
  healthResolvers,
  authResolvers,
  motorcycleResolvers,
  servicePointResolvers,
  mediaResolvers,
]);
