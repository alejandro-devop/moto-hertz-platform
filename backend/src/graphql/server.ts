import type { Request } from 'express';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { verifyAdminToken } from '../shared/auth/jwt';

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
 * Contexto de GraphQL. Las queries de catálogo siguen siendo públicas
 * (consumidas por `web` sin usuarios finales); el JWT emitido por la
 * mutation `login` (admin único de `cms-admin`, ver Fase 3/4) se valida
 * aquí y, si es válido, se expone en `context.user` para que las
 * mutaciones de escritura lo exijan vía `requireAuth`.
 */
export async function getGraphQLContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return {};
  }

  const token = authHeader.slice('Bearer '.length);
  const payload = verifyAdminToken(token);
  if (!payload) {
    return {};
  }

  return { user: { id: Number(payload.sub), email: payload.email } };
}
