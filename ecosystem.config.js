// PM2 — procesos de producción de moto-hertz-platform (droplet, sin Docker).
// Los secrets NUNCA van aquí: este archivo se commitea. Vive en
// .env.production (raíz, gitignored — no versionado), que solo existe en el
// servidor. Ver docs/architecture/deployment.md.
//
// Uso: pm2 start ecosystem.config.js
'use strict';

const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const prodEnv = loadEnvFile(path.join(__dirname, '.env.production'));

module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: path.join(__dirname, 'backend'),
      script: 'dist/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        LOG_LEVEL: 'info',
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6380,
        ENABLE_REDIS_CACHE: 'true',
        JWT_EXPIRES_IN: '12h',
        STORAGE_DRIVER: 'local',
        MEDIA_ROOT: './uploads',
        MEDIA_MAX_UPLOAD_MB: 15,
        ...prodEnv,
      },
    },
    {
      name: 'web',
      cwd: path.join(__dirname, 'web'),
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'cms-admin',
      cwd: path.join(__dirname, 'cms-admin'),
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        BACKEND_GRAPHQL_URL: 'http://localhost:8080/graphql',
      },
    },
  ],
};
