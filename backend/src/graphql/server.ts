import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

export interface GraphQLContext {
  user?: {
    id: number;
    email: string;
  } | null;
}

export function createApolloServer(httpServer: any) {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageDisabled(),
    ],
    introspection: isDevelopment,
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return error;
    },
  });
}

/**
 * Contexto de GraphQL. Sin autenticación en esta fase — los dominios
 * actuales (motorcycle, service-point, service, news) son de lectura
 * pública. Cuando exista cms-admin (Fase 3/4) se añadirá aquí la
 * extracción del JWT y el usuario autenticado, igual que en el bootstrap
 * original de xavi-platform-node.
 */
export async function getGraphQLContext(): Promise<GraphQLContext> {
  return {};
}
