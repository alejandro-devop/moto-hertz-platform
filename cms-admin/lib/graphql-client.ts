import { GraphQLClient } from 'graphql-request';

/**
 * Cliente GraphQL del navegador. Apunta al proxy same-origin
 * (`/api/graphql`), que es quien adjunta el JWT desde la cookie httpOnly.
 * graphql-request requiere una URL absoluta (usa `new URL()` internamente),
 * por eso se resuelve contra `window.location.origin` en vez de pasar una
 * ruta relativa.
 */
export const graphqlClient = new GraphQLClient(
  typeof window !== 'undefined' ? new URL('/api/graphql', window.location.origin).toString() : '/api/graphql'
);
