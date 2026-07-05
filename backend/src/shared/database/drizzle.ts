import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { logger } from '../logger';

export type DrizzleDb = NodePgDatabase<typeof schema>;

let db: DrizzleDb | null = null;
let pool: Pool | null = null;

export function initializeDrizzle(): DrizzleDb {
  if (db) return db;

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl:
        databaseUrl.includes('neon.tech') || databaseUrl.includes('amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });
  } else {
    const isCloudRun = process.env.K_SERVICE !== undefined;

    pool = new Pool({
      host: isCloudRun ? `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}` : process.env.DB_HOST,
      port: isCloudRun ? undefined : parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });
  }

  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected database pool error (Drizzle)');
  });

  pool.on('connect', () => {
    logger.debug('New database connection established (Drizzle)');
  });

  pool.on('remove', () => {
    logger.debug('Database connection removed from pool (Drizzle)');
  });

  db = drizzle(pool, { schema });

  logger.info(
    {
      max: pool.options.max,
      min: pool.options.min,
      host: databaseUrl ? 'connection-string' : pool.options.host,
    },
    'Drizzle ORM initialized'
  );

  return db;
}

export function getDb(): DrizzleDb {
  if (!db) {
    throw new Error('Drizzle not initialized. Call initializeDrizzle() first.');
  }
  return db;
}

export async function closeDrizzle(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    logger.info('Drizzle pool closed');
  }
}

export function getDrizzlePool(): Pool {
  if (!pool) {
    throw new Error('Pool not initialized. Call initializeDrizzle() first.');
  }
  return pool;
}
