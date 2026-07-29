export function getBackendGraphQLUrl(): string {
  return process.env.BACKEND_GRAPHQL_URL || 'http://localhost:8080/graphql';
}
