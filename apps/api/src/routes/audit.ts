import { Router } from 'express';
import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { parseListParams, pagedResult, orderByOrDefault } from '../lib/pagination.js';
import { exportFormat, sendCsv, sendPdf } from '../lib/export.js';
import { audit, auditContextFromReq } from '../lib/audit.js';

const router = Router();

// Audit trail is HR Administrator only, and strictly read-only.
router.use(requireModule('audit', 'view'));

function buildWhere(params: ReturnType<typeof parseListParams>): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  if (params.q) {
    where.OR = [
      { summary: { contains: params.q, mode: 'insensitive' } },
      { actorName: { contains: params.q, mode: 'insensitive' } },
      { entityType: { contains: params.q, mode: 'insensitive' } },
    ];
  }
  if (params.filters.action) where.action = params.filters.action as AuditAction;
  if (params.filters.entityType) where.entityType = params.filters.entityType;
  if (params.filters.from || params.filters.to) {
    where.createdAt = {};
    if (params.filters.from) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(params.filters.from);
    if (params.filters.to) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(params.filters.to);
  }
  return where;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = parseListParams(req, {
      sortable: ['createdAt', 'action', 'entityType', 'actorName'],
      filterable: ['action', 'entityType', 'from', 'to'],
      defaultSort: 'createdAt:desc',
    });
    const where = buildWhere(params);

    if (exportFormat(req.query.export)) {
      const rows = await prisma.auditLog.findMany({ where, orderBy: orderByOrDefault(params, { createdAt: 'desc' }), take: 5000 });
      const columns = [
        { header: 'Time', value: (r: (typeof rows)[number]) => r.createdAt.toISOString(), width: 1.4 },
        { header: 'Actor', value: (r: (typeof rows)[number]) => r.actorName, width: 1.2 },
        { header: 'Role', value: (r: (typeof rows)[number]) => r.actorRole ?? '', width: 1 },
        { header: 'Action', value: (r: (typeof rows)[number]) => r.action, width: 0.8 },
        { header: 'Entity', value: (r: (typeof rows)[number]) => `${r.entityType}${r.entityId ? ` #${r.entityId}` : ''}`, width: 1.4 },
        { header: 'Summary', value: (r: (typeof rows)[number]) => r.summary, width: 2.5 },
      ];
      await audit(auditContextFromReq(req), { action: 'EXPORT', entityType: 'AuditLog', summary: `Exported ${rows.length} audit rows` });
      if (req.query.export === 'csv') return sendCsv(res, 'audit-log', columns, rows);
      return sendPdf(res, 'audit-log', { title: 'Audit trail', columns, rows });
    }

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip: params.skip, take: params.take, orderBy: orderByOrDefault(params, { createdAt: 'desc' }) }),
      prisma.auditLog.count({ where }),
    ]);
    res.json(pagedResult(rows, total, params));
  }),
);

// Convenience: recent activity for a specific entity.
router.get(
  '/entity/:type/:id',
  asyncHandler(async (req, res) => {
    const rows = await prisma.auditLog.findMany({
      where: { entityType: req.params.type, entityId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ data: rows });
  }),
);

export default router;
