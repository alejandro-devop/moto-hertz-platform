import { mergeResolvers } from '@graphql-tools/merge';
import { healthResolvers } from './modules/common/health.resolvers';
import { motorcycleResolvers } from './modules/motorcycle/motorcycle.resolvers';

// Nuevos dominios (service-point, service, news) siguen el mismo patrón
// que motorcycle: agregar su <domain>.resolvers.ts aquí.
export const resolvers: any = mergeResolvers([healthResolvers, motorcycleResolvers]);
