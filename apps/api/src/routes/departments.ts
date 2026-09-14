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
  asyncHandler(async (_req, res) => {
    const departments = await prisma.department.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { employees: true, positions: true } } },
    });
    res.json({ data: departments });
  }),
);

const upsertSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

router.post(
  '/',
  requireModule('admin', 'manage'),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    const created = await prisma.department.create({ data });
    await audit(auditContextFromReq(req), {
      action: 'CREATE',
      entityType: 'Department',
      entityId: created.id,
      summary: `Created department ${created.name}`,
      newValue: created,
    });
    res.status(201).json(created);
  }),
);

router.put(
  '/:id',
  requireModule('admin', 'manage'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound('Department not found');
    const data = upsertSchema.partial().parse(req.body);
    const updated = await prisma.department.update({ where: { id: req.params.id }, data });
    await audit(auditContextFromReq(req), {
      action: 'UPDATE',
      entityType: 'Department',
      entityId: updated.id,
      summary: `Updated department ${updated.name}`,
      previousValue: snapshot(existing),
      newValue: snapshot(updated),
    });
    res.json(updated);
  }),
);

export default router;
