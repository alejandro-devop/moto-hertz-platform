import jwt from 'jsonwebtoken';

export interface AdminTokenPayload {
  sub: string;
  email: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export function signAdminToken(payload: AdminTokenPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '12h') as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AdminTokenPayload;
  } catch {
    return null;
  }
}
