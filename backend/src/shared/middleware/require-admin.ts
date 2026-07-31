import type { NextFunction, Request, Response } from 'express';
import { verifyAdminToken, type AdminTokenPayload } from '../auth/jwt';
import { UnauthorizedError } from '../errors';

export interface AuthenticatedRequest extends Request {
  admin?: AdminTokenPayload;
}

/**
 * La misma sesión que exigen las mutaciones de GraphQL, para las rutas Express
 * que no pueden ir por GraphQL (hoy: la subida de archivos, que es binaria).
 * Mismo header, mismo secreto, mismo token que emite `login`.
 */
export function requireAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Falta la sesión de administrador.'));
    return;
  }

  const payload = verifyAdminToken(header.slice('Bearer '.length));
  if (!payload) {
    next(new UnauthorizedError('La sesión venció o no es válida. Vuelve a entrar al panel.'));
    return;
  }

  req.admin = payload;
  next();
}
