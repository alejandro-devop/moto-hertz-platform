import { gql } from 'graphql-tag';
import { scalarsTypeDefs } from './modules/common/scalars.schema';
import { healthTypeDefs } from './modules/common/health.schema';
import { authTypeDefs } from './modules/auth/auth.schema';
import { motorcycleTypeDefs } from './modules/motorcycle/motorcycle.schema';
import { servicePointTypeDefs } from './modules/service-point/service-point.schema';
import { serviceTypeDefs } from './modules/service/service.schema';
import { newsTypeDefs } from './modules/news/news.schema';
import { mediaTypeDefs } from './modules/media/media.schema';
import { bannerTypeDefs } from './modules/banner/banner.schema';
import { siteSettingsTypeDefs } from './modules/site-settings/site-settings.schema';
import { pageContentTypeDefs } from './modules/page-content/page-content.schema';

// Base Query and Mutation types
const baseTypeDefs = gql`
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

// Combine all type definitions.
// Nuevos dominios siguen el mismo patrón que motorcycle:
// agregar su <domain>.schema.ts aquí.
export const typeDefs = [
  baseTypeDefs,
  scalarsTypeDefs,
  healthTypeDefs,
  authTypeDefs,
  motorcycleTypeDefs,
  servicePointTypeDefs,
  serviceTypeDefs,
  newsTypeDefs,
  mediaTypeDefs,
  bannerTypeDefs,
  siteSettingsTypeDefs,
  pageContentTypeDefs,
];
