import { gql } from 'graphql-tag';
import { scalarsTypeDefs } from './modules/common/scalars.schema';
import { healthTypeDefs } from './modules/common/health.schema';
import { authTypeDefs } from './modules/auth/auth.schema';
import { motorcycleTypeDefs } from './modules/motorcycle/motorcycle.schema';

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
// Nuevos dominios (service-point, service, news) siguen el mismo patrón
// que motorcycle: agregar su <domain>.schema.ts aquí.
export const typeDefs = [
  baseTypeDefs,
  scalarsTypeDefs,
  healthTypeDefs,
  authTypeDefs,
  motorcycleTypeDefs,
];
