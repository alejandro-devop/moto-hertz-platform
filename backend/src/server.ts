import { createApp } from './app';
import { initializeServices } from './shared/config';
import { closeDbPool } from './shared/database/pool';
import { closeRedisClient } from './shared/redis/client';
import { logger } from './shared/logger';
import { createApolloServer, getGraphQLContext } from './graphql/server';
import { expressMiddleware } from '@as-integrations/express4';
import { json } from 'express';
import http from 'http';

const PORT = process.env.PORT || 8080;
let server: http.Server;
let apolloServer: any;

console.log('=== STARTING YAMAHA ORIENTE API ===');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('K_SERVICE:', process.env.K_SERVICE);

async function start() {
  try {
    logger.info('Starting server initialization...');

    const app = createApp();
    const httpServer = http.createServer(app);

    console.log('Initializing Apollo GraphQL Server...');
    apolloServer = createApolloServer(httpServer);
    await apolloServer.start();
    console.log('✅ Apollo Server started');

    app.use(
      '/graphql',
      json(),
      expressMiddleware(apolloServer, {
        context: getGraphQLContext,
      })
    );
    console.log('✅ GraphQL endpoint mounted at /graphql');

    if (process.env.NODE_ENV !== 'production') {
      app.get('/graphiql', (_req, res) => {
        res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GraphiQL - Yamaha Oriente API</title>
  <link rel="stylesheet" href="https://unpkg.com/graphiql@3.1.1/graphiql.min.css" />
  <style>
    body { margin: 0; padding: 0; height: 100vh; overflow: hidden; }
    #graphiql { height: 100vh; }
  </style>
</head>
<body>
  <div id="graphiql">Loading...</div>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/graphiql@3.1.1/graphiql.min.js"></script>
  <script>
    const root = ReactDOM.createRoot(document.getElementById('graphiql'));
    const fetcher = GraphiQL.createFetcher({ url: '/graphql' });
    const defaultQuery = \`# Bienvenido a GraphiQL - Yamaha Oriente API
query HealthCheck {
  health {
    status
    timestamp
  }
}

# query ListMotorcycles {
#   motorcycles(limit: 5) {
#     total
#     motorcycles { id slug name category price }
#   }
# }
\`;
    root.render(
      React.createElement(GraphiQL, {
        fetcher: fetcher,
        defaultQuery: defaultQuery,
        headerEditorEnabled: true,
        shouldPersistHeaders: true,
      })
    );
  </script>
</body>
</html>
        `);
      });
      console.log('✅ GraphiQL IDE mounted at /graphiql');
    }

    server = httpServer.listen(PORT, () => {
      console.log('✅ Server listening on port', PORT);
      console.log('📊 GraphQL endpoint: http://localhost:' + PORT + '/graphql');
      if (process.env.NODE_ENV !== 'production') {
        console.log('🚀 GraphiQL IDE: http://localhost:' + PORT + '/graphiql');
      }
      logger.info({ port: PORT }, 'Server started successfully');
    });

    console.log('Initializing services...');
    await initializeServices();
    console.log('✅ Services initialized');

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, starting graceful shutdown');
      await shutdown();
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, starting graceful shutdown');
      await shutdown();
    });
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

async function shutdown() {
  try {
    if (apolloServer) {
      await apolloServer.stop();
      logger.info('Apollo Server stopped');
    }

    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    await closeDbPool();
    await closeRedisClient();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Shutdown error:', error);
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
}

start();
