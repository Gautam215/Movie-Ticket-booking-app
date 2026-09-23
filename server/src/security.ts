import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@eventra/shared';
import { env } from './config.js';
import { forbidden, unauthorized } from './errors.js';

type TokenPayload = { sub: string; role: UserRole };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'] });
}

function readToken(request: Request): string | null {
  return request.cookies?.eventra_access ?? null;
}

export function requireAuth(request: Request, _response: Response, next: NextFunction): void {
  const token = readToken(request);
  if (!token) return next(unauthorized());

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    if (!payload.sub || !payload.role) return next(unauthorized());
    request.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    next(unauthorized());
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.auth) return next(unauthorized());
    if (!roles.includes(request.auth.role)) return next(forbidden());
    next();
  };
}

export const authCookie = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  maxAge: 15 * 60 * 1000,
  path: '/',
});
