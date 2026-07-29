import bcrypt from 'bcryptjs';
import { UnauthorizedError } from '../shared/errors';
import { signAdminToken } from '../shared/auth/jwt';

export interface LoginResult {
  token: string;
  user: { id: string; email: string };
}

/**
 * Login del admin único de cms-admin. No hay tabla de usuarios: las
 * credenciales del admin viven en variables de entorno (ADMIN_EMAIL /
 * ADMIN_PASSWORD_HASH), consistente con la decisión de Fase 3 de un solo
 * rol admin sin roles diferenciados.
 */
export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !adminPasswordHash) {
      throw new Error('ADMIN_EMAIL / ADMIN_PASSWORD_HASH are not configured');
    }

    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, adminPasswordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const user = { id: '1', email: adminEmail };
    const token = signAdminToken({ sub: user.id, email: user.email });

    return { token, user };
  },
};
