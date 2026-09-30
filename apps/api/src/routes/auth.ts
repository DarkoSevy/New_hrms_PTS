import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { BadRequest, Unauthorized } from '../lib/errors.js';
import { verifyPassword } from '../auth/passwords.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiry,
  signAccessToken,
} from '../auth/jwt.js';
import { audit } from '../lib/audit.js';
import { visibleModules, canViewCompensation } from '../rbac/matrix.js';

const router = Router();
const REFRESH_COOKIE = 'pts_refresh';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000,
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function issueSession(userId: string, ip?: string) {
  const { token, hash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hash, expiresAt: refreshExpiry(), createdByIp: ip ?? null },
  });
  return token;
}

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { employee: { select: { id: true } } },
    });

    // Constant-ish behaviour: always run a comparison to reduce user enumeration.
    const ok = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !ok || !user.isActive) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' },
      });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const refresh = await issueSession(user.id, req.ip);
    const access = signAccessToken({
      sub: user.id,
      role: user.role,
      employeeId: user.employeeId,
      name: user.fullName,
    });

    await audit(
      { actorUserId: user.id, actorName: user.fullName, actorRole: user.role, ip: req.ip, userAgent: req.get('user-agent') },
      { action: 'LOGIN', entityType: 'User', entityId: user.id, summary: `${user.fullName} signed in` },
    );

    res.cookie(REFRESH_COOKIE, refresh, cookieOptions);
    return res.json({
      accessToken: access,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        initials: user.initials,
        employeeId: user.employeeId,
        modules: visibleModules(user.role),
        canViewCompensation: canViewCompensation(user.role),
      },
    });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) throw Unauthorized('No active session.');
    const hash = hashRefreshToken(raw);
    const existing = await prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: { user: true },
    });

    if (!existing) {
      res.clearCookie(REFRESH_COOKIE, cookieOptions);
      throw Unauthorized('Session not recognised.');
    }

    // Reuse of an already-rotated token => likely theft. Revoke the whole family.
    if (existing.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      res.clearCookie(REFRESH_COOKIE, cookieOptions);
      throw Unauthorized('Session invalidated. Please sign in again.');
    }

    if (existing.expiresAt < new Date() || !existing.user.isActive) {
      res.clearCookie(REFRESH_COOKIE, cookieOptions);
      throw Unauthorized('Session expired. Please sign in again.');
    }

    // Rotate.
    const next = await issueSession(existing.userId, req.ip);
    const nextHash = hashRefreshToken(next);
    await prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedBy: nextHash },
    });

    const access = signAccessToken({
      sub: existing.user.id,
      role: existing.user.role,
      employeeId: existing.user.employeeId,
      name: existing.user.fullName,
    });
    res.cookie(REFRESH_COOKIE, next, cookieOptions);
    return res.json({ accessToken: access });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (raw) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashRefreshToken(raw), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    return res.status(204).end();
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const user = await prisma.user.findUnique({
      where: { id: p.userId },
      include: {
        employee: {
          include: { department: true, position: true, status: true },
        },
      },
    });
    if (!user) throw Unauthorized();
    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      initials: user.initials,
      employeeId: user.employeeId,
      modules: visibleModules(user.role),
      canViewCompensation: canViewCompensation(user.role),
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            department: user.employee.department.name,
            position: user.employee.position.title,
            status: user.employee.status.name,
            isOperational: user.employee.isOperational,
          }
        : null,
    });
  }),
);

// Self password change.
const changePwSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
router.post(
  '/change-password',
  authenticate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePwSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.principal!.userId } });
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      throw BadRequest('Current password is incorrect.');
    }
    const { hashPassword } = await import('../auth/passwords.js');
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit(
      { actorUserId: user.id, actorName: user.fullName, actorRole: user.role, ip: req.ip },
      { action: 'UPDATE', entityType: 'User', entityId: user.id, summary: `${user.fullName} changed their password` },
    );
    return res.json({ ok: true });
  }),
);

export default router;
