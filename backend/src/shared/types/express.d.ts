export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

// Placeholder de autenticación: sin implementación en esta fase (solo
// cms-admin la necesitará, ver Fase 3/4). Se deja el tipo para que
// middleware/logging genérico (req.user) tipe correctamente desde ya.
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
