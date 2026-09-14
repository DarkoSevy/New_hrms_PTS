import { Router } from 'express';
import { z } from 'zod';
import { Prisma, RequestPriority, RequestStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { ownedRecordScope } from '../rbac/scope.js';
import { audit, auditContextFromReq } from '../lib/audit.js';
import { BadRequest, Forbidden, NotFound } from '../lib/errors.js';
import { exportFormat, sendCsv, sendPdf } from '../lib/export.js';
import { fmtDate } from '../lib/dates.js';

const router = Router();
const YEAR = new Date().getFullYear();

async function nextRef(): Promise<string> {
  const prefix = `HR-${YEAR}-`;
  const last = await prisma.hrRequest.findFirst({ where: { reference: { startsWith: prefix } }, orderBy: { reference: 'desc' }, select: { reference: true } });
  const seq = last ? Number(last.reference.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

function ageDays(from: Date): number {
  return Math.max(0, Math.floor((Date.now() - from.getTime()) / 86400000));
}

router.get(
  '/self',
  requireModule('requests', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    if (!p.employeeId) throw BadRequest('No employee record linked to your account.');
    const [mine, catalogue] = await Promise.all([
      prisma.hrRequest.findMany({ where: { employeeId: p.employeeId }, include: { requestType: true }, orderBy: { raisedAt: 'desc' } }),
      prisma.requestType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    ]);
    res.json({
      mine: mine.map((r) => ({ id: r.id, reference: r.reference, category: r.category, detail: r.detail, status: r.status, raisedAt: r.raisedAt, meta: `${fmtDate(r.raisedAt)} · SLA ${r.slaDays}d` })),
      catalogue: catalogue.map((c) => ({ id: c.id, name: c.name, slaDays: c.slaDays })),
    });
  }),
);

router.get(
  '/',
  requireModule('requests', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const scope = ownedRecordScope(p) as Prisma.HrRequestWhereInput;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const where: Prisma.HrRequestWhereInput = { AND: [scope, status && status !== 'all' ? { status: status as RequestStatus } : {}] };

    const rows = await prisma.hrRequest.findMany({
      where,
      include: { employee: { select: { fullName: true, initials: true, isOperational: true, position: { select: { title: true } }, department: { select: { name: true } } } }, requestType: true, owner: { select: { fullName: true } } },
      orderBy: { raisedAt: 'desc' },
    });

    const decorate = (r: (typeof rows)[number]) => {
      const age = ageDays(r.raisedAt);
      const overdue = r.status !== RequestStatus.RESOLVED && age > r.slaDays;
      return {
        id: r.id, reference: r.reference, name: r.employee.fullName, initials: r.employee.initials,
        role: `${r.employee.position.title} · ${r.employee.department.name}`, category: r.category, detail: r.detail,
        priority: r.priority, status: overdue ? 'OVERDUE' : r.status, owner: r.owner?.fullName ?? 'Unassigned',
        age: `${age}d`, sla: `${r.slaDays}d`, isOperational: r.employee.isOperational,
      };
    };
    const data = rows.map(decorate);

    if (exportFormat(req.query.export)) {
      const columns = [
        { header: 'Reference', value: (r: (typeof data)[number]) => r.reference, width: 1 },
        { header: 'Employee', value: (r: (typeof data)[number]) => r.name, width: 1.4 },
        { header: 'Category', value: (r: (typeof data)[number]) => r.category, width: 1.4 },
        { header: 'Priority', value: (r: (typeof data)[number]) => r.priority, width: 0.7 },
        { header: 'Status', value: (r: (typeof data)[number]) => r.status, width: 1 },
        { header: 'Age / SLA', value: (r: (typeof data)[number]) => `${r.age} / ${r.sla}`, width: 0.9 },
      ];
      await audit(auditContextFromReq(req), { action: 'EXPORT', entityType: 'HrRequest', summary: `Exported ${data.length} requests` });
      if (req.query.export === 'csv') return sendCsv(res, 'requests', columns, data);
      return sendPdf(res, 'requests', { title: 'HR requests', columns, rows: data });
    }

    const catalogue = await prisma.requestType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
    const open = data.filter((r) => r.status !== 'RESOLVED').length;
    const pastSla = data.filter((r) => r.status === 'OVERDUE').length;
    const resolved = rows.filter((r) => r.status === RequestStatus.RESOLVED && r.resolvedAt);
    const avgResolve = resolved.length ? (resolved.reduce((s, r) => s + Math.max(0, (r.resolvedAt!.getTime() - r.raisedAt.getTime()) / 86400000), 0) / resolved.length).toFixed(1) : '0';

    res.json({
      data,
      kpis: { open, pastSla, avgResolve },
      catalogue: catalogue.map((c) => ({ id: c.id, name: c.name, slaDays: c.slaDays })),
      canManage: p.role === Role.HR_ADMINISTRATOR || p.role === Role.HR_OFFICER,
    });
  }),
);

const createSchema = z.object({
  requestTypeId: z.string(),
  detail: z.string().min(1),
  priority: z.nativeEnum(RequestPriority).optional(),
  employeeId: z.string().optional(),
});
router.post(
  '/',
  requireModule('requests', 'manage'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const data = createSchema.parse(req.body);
    const employeeId = p.role === Role.EMPLOYEE ? p.employeeId : (data.employeeId ?? p.employeeId);
    if (!employeeId) throw BadRequest('No employee to raise for.');
    const type = await prisma.requestType.findUnique({ where: { id: data.requestTypeId } });
    if (!type) throw BadRequest('Unknown request type.');
    const reference = await nextRef();
    const created = await prisma.hrRequest.create({
      data: { reference, employeeId, requestTypeId: type.id, category: type.name, detail: data.detail, priority: data.priority ?? RequestPriority.NORMAL, slaDays: type.slaDays, status: RequestStatus.IN_PROGRESS },
    });
    await audit(auditContextFromReq(req), { action: 'CREATE', entityType: 'HrRequest', entityId: created.id, summary: `Raised ${type.name} request ${reference}`, newValue: { reference, category: type.name } });
    res.status(201).json(created);
  }),
);

const updateSchema = z.object({
  status: z.nativeEnum(RequestStatus).optional(),
  ownerId: z.string().nullable().optional(),
  priority: z.nativeEnum(RequestPriority).optional(),
});
router.put(
  '/:id',
  requireModule('requests', 'manage'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    if (p.role === Role.EMPLOYEE) throw Forbidden('Employees cannot change request handling.');
    const existing = await prisma.hrRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound('Request not found');
    const data = updateSchema.parse(req.body);
    const updated = await prisma.hrRequest.update({
      where: { id: req.params.id },
      data: {
        ...(data.status ? { status: data.status, resolvedAt: data.status === RequestStatus.RESOLVED ? new Date() : null } : {}),
        ...(data.ownerId !== undefined ? { ownerId: data.ownerId } : {}),
        ...(data.priority ? { priority: data.priority } : {}),
      },
    });
    await audit(auditContextFromReq(req), { action: 'UPDATE', entityType: 'HrRequest', entityId: updated.id, summary: `Updated request ${updated.reference}`, previousValue: { status: existing.status, ownerId: existing.ownerId }, newValue: { status: updated.status, ownerId: updated.ownerId } });
    res.json(updated);
  }),
);

export default router;
