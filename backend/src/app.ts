import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { getCorsOptions } from './shared/config/cors';
import { requestLogger, errorHandler } from './shared/middleware';
import routes from './routes';
import { getStorage, LocalStorageDriver } from './shared/storage';

export function createApp(): Application {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? undefined
          : {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://unpkg.com'],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
                connectSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                fontSrc: ["'self'", 'data:'],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
              },
            },
    })
  );
  app.use(cors(getCorsOptions()));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(compression());

  app.use(requestLogger);

  /**
   * Los archivos subidos. Solo aplica al driver local: un bucket sirve los
   * suyos. Las claves llevan 16 bytes aleatorios y el contenido nunca cambia
   * bajo la misma clave, así que se pueden cachear para siempre.
   */
  const storage = getStorage();
  if (storage instanceof LocalStorageDriver) {
    app.use(
      '/media',
      express.static(storage.rootPath, {
        immutable: true,
        maxAge: '365d',
        index: false,
      })
    );
  }

  app.use('/api', routes);

  app.use(errorHandler);

  return app;
}
