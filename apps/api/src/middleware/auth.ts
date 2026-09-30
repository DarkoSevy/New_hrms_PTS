import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../auth/jwt.js';
import { Unauthorized } from '../lib/errors.js';

/**
 * Authenticate the request from the Bearer access token. Populates
 * `req.principal`. The role and identity come ONLY from the verified token —
 * never from a header, query param, or body the client controls. There is no
 * role switcher in production.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return next(Unauthorized());
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.principal = {
      userId: payload.sub,
      role: payload.role,
      employeeId: payload.employeeId,
      fullName: payload.name,
    };
    return next();
  } catch {
    return next(Unauthorized('Your session has expired. Please sign in again.'));
  }
}
