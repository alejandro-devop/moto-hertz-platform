import { mergeResolvers } from '@graphql-tools/merge';
import { healthResolvers } from './modules/common/health.resolvers';
import { authResolvers } from './modules/auth/auth.resolvers';
import { motorcycleResolvers } from './modules/motorcycle/motorcycle.resolvers';
import { servicePointResolvers } from './modules/service-point/service-point.resolvers';
import { serviceResolvers } from './modules/service/service.resolvers';
import { newsResolvers } from './modules/news/news.resolvers';
import { mediaResolvers } from './modules/media/media.resolvers';
import { bannerResolvers } from './modules/banner/banner.resolvers';

// Nuevos dominios siguen el mismo patrón que motorcycle:
// agregar su <domain>.resolvers.ts aquí.
export const resolvers: any = mergeResolvers([
  healthResolvers,
  authResolvers,
  motorcycleResolvers,
  servicePointResolvers,
  serviceResolvers,
  newsResolvers,
  mediaResolvers,
  bannerResolvers,
]);
