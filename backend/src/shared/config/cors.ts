import type { CorsOptions } from 'cors';

/** Frontends que consumen esta API en producción (siempre permitidos). */
const BUILTIN_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getAllowedOrigins(): string[] {
  const set = new Set(BUILTIN_ALLOWED_ORIGINS);
  const fromEnv = process.env.ALLOWED_ORIGINS?.split(/[,|]/)
    .map((o) => o.trim())
    .filter(Boolean);
  for (const origin of fromEnv ?? []) {
    set.add(origin);
  }
  return [...set];
}

function isLocalDevOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function getCorsOptions(): CorsOptions {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length'],
    maxAge: 86_400,
  };
}
