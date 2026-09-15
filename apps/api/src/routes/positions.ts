import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { audit, auditContextFromReq, snapshot } from '../lib/audit.js';
import { NotFound } from '../lib/errors.js';

const router = Router();

router.get(
  '/',
  requireModule('people', 'view'),
  asyncHandler(async (req, res) => {
    const where = typeof req.query.departmentId === 'string' ? { departmentId: req.query.departmentId } : {};
    const positions = await prisma.position.findMany({
      where,
      orderBy: { title: 'asc' },
      include: { department: { select: { name: true } }, _count: { select: { employees: true } } },
    });
    res.json({ data: positions });
  }),
);

const upsertSchema = z.object({
  title: z.string().min(1),
  code: z.string().min(1),
  grade: z.string().optional().nullable(),
  isOperational: z.boolean().optional(),
  isActive: z.boolean().optional(),
  departmentId: z.string().min(1),
});

router.post(
  '/',
  requireModule('admin', 'manage'),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const created = await prisma.position.create({ data });
    await audit(auditContextFromReq(req), {
      action: 'CREATE',
      entityType: 'Position',
      entityId: created.id,
      summary: `Created position ${created.title}`,
      newValue: created,
    });
    res.status(201).json(created);
  }),
);

router.put(
  '/:id',
  requireModule('admin', 'manage'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.position.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound('Position not found');
    const data = upsertSchema.partial().parse(req.body);
    const updated = await prisma.position.update({ where: { id: req.params.id }, data });
    await audit(auditContextFromReq(req), {
      action: 'UPDATE',
      entityType: 'Position',
      entityId: updated.id,
      summary: `Updated position ${updated.title}`,
      previousValue: snapshot(existing),
      newValue: snapshot(updated),
    });
    res.json(updated);
  }),
);

export default router;
