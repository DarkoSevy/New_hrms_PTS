import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string; // userId
  role: Role;
  employeeId: string | null;
  name: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessTtl as jwt.SignOptions['expiresIn'],
    issuer: 'pts-hrms',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret, { issuer: 'pts-hrms' }) as AccessTokenPayload;
}

/**
 * Refresh tokens are opaque random strings. Only their SHA-256 hash is stored,
 * and every use rotates the token (see auth service). This limits the blast
 * radius if the database is compromised and detects token theft on reuse.
 */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(48).toString('base64url');
  const hash = hashRefreshToken(token);
  return { token, hash };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshExpiry(): Date {
  return new Date(Date.now() + env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000);
}
