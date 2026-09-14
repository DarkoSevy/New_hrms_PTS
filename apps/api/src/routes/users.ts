import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { audit, auditContextFromReq } from '../lib/audit.js';
import { hashPassword } from '../auth/passwords.js';
import { parseListParams, pagedResult, orderByOrDefault } from '../lib/pagination.js';
import { NotFound } from '../lib/errors.js';

const router = Router();

// User administration is HR Administrator only (admin module).
router.use(requireModule('admin', 'view'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = parseListParams(req, {
      sortable: ['fullName', 'email', 'role', 'createdAt', 'lastLoginAt'],
      filterable: ['role', 'isActive'],
      defaultSort: 'fullName:asc',
    });
    const where: Record<string, unknown> = {};
    if (params.q) {
      where.OR = [
        { fullName: { contains: params.q, mode: 'insensitive' } },
        { email: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params.filters.role) where.role = params.filters.role as Role;
    if (params.filters.isActive) where.isActive = params.filters.isActive === 'true';

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: orderByOrDefault(params, { fullName: 'asc' }),
        select: {
          id: true, email: true, role: true, fullName: true, initials: true,
          isActive: true, lastLoginAt: true, createdAt: true, employeeId: true,
          employee: { select: { employeeCode: true, department: { select: { name: true } } } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    res.json(pagedResult(rows, total, params));
  }),
);

const createSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.nativeEnum(Role),
  employeeId: z.string().optional().nullable(),
  password: z.string().min(8),
});

function initialsOf(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

router.post(
  '/',
  requireModule('admin', 'manage'),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const created = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        fullName: data.fullName,
        initials: initialsOf(data.fullName),
        role: data.role,
        employeeId: data.employeeId || null,
        passwordHash: await hashPassword(data.password),
      },
      select: { id: true, email: true, role: true, fullName: true, isActive: true },
    });
    await audit(auditContextFromReq(req), {
      action: 'CREATE',
      entityType: 'User',
      entityId: created.id,
      summary: `Created user ${created.email} with role ${created.role}`,
      newValue: { email: created.email, role: created.role },
    });
    res.status(201).json(created);
  }),
);

const updateSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  fullName: z.string().min(1).optional(),
});

router.put(
  '/:id',
  requireModule('admin', 'manage'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound('User not found');
    const data = updateSchema.parse(req.body);
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { ...data, ...(data.fullName ? { initials: initialsOf(data.fullName) } : {}) },
      select: { id: true, email: true, role: true, fullName: true, isActive: true },
    });
    // Revoke sessions on role change or deactivation.
    if ((data.role && data.role !== existing.role) || data.isActive === false) {
      await prisma.refreshToken.updateMany({ where: { userId: existing.id, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await audit(auditContextFromReq(req), {
      action: 'UPDATE',
      entityType: 'User',
      entityId: updated.id,
      summary: `Updated user ${updated.email}`,
      previousValue: { role: existing.role, isActive: existing.isActive, fullName: existing.fullName },
      newValue: { role: updated.role, isActive: updated.isActive, fullName: updated.fullName },
    });
    res.json(updated);
  }),
);

const resetSchema = z.object({ password: z.string().min(8) });
router.post(
  '/:id/reset-password',
  requireModule('admin', 'manage'),
  asyncHandler(async (req, res) => {
    const { password } = resetSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw NotFound('User not found');
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
    await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit(auditContextFromReq(req), {
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      summary: `Reset password for ${user.email}`,
    });
    res.json({ ok: true });
  }),
);

export default router;
