import { Router } from 'express';
import { z } from 'zod';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { employeeScope } from '../rbac/scope.js';
import { audit, auditContextFromReq } from '../lib/audit.js';
import { exportFormat, sendCsv, sendPdf } from '../lib/export.js';
import { parseListParams, pagedResult } from '../lib/pagination.js';

const router = Router();

function dayFromQuery(q: unknown): Date {
  const d = typeof q === 'string' ? new Date(q) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get(
  '/',
  requireModule('attendance', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const date = dayFromQuery(req.query.date);
    const params = parseListParams(req, { sortable: ['status'], filterable: ['status', 'departmentId'], defaultSort: 'status:asc' });

    const where: Prisma.AttendanceWhereInput = { date, employee: employeeScope(p) };
    if (params.filters.status) where.status = params.filters.status as AttendanceStatus;
    if (params.filters.departmentId) where.employee = { ...(where.employee as object), departmentId: params.filters.departmentId };
    if (params.q) where.employee = { ...(where.employee as object), fullName: { contains: params.q, mode: 'insensitive' } };

    const include = { employee: { select: { fullName: true, initials: true, isOperational: true, department: { select: { name: true } }, position: { select: { title: true } } } } };

    if (exportFormat(req.query.export)) {
      const rows = await prisma.attendance.findMany({ where, include, orderBy: { employee: { fullName: 'asc' } }, take: 5000 });
      const columns = [
        { header: 'Employee', value: (r: (typeof rows)[number]) => r.employee.fullName, width: 1.6 },
        { header: 'Department', value: (r: (typeof rows)[number]) => r.employee.department.name, width: 1.2 },
        { header: 'Status', value: (r: (typeof rows)[number]) => r.status, width: 1 },
        { header: 'Check in', value: (r: (typeof rows)[number]) => r.checkIn ?? '', width: 0.8 },
      ];
      await audit(auditContextFromReq(req), { action: 'EXPORT', entityType: 'Attendance', summary: `Exported attendance for ${date.toDateString()}` });
      if (req.query.export === 'csv') return sendCsv(res, 'attendance', columns, rows);
      return sendPdf(res, 'attendance', { title: `Attendance — ${date.toLocaleDateString('en-GB')}`, columns, rows });
    }

    const [rows, total, summary] = await Promise.all([
      prisma.attendance.findMany({ where, include, skip: params.skip, take: params.take, orderBy: { employee: { fullName: 'asc' } } }),
      prisma.attendance.count({ where }),
      prisma.attendance.groupBy({ by: ['status'], where: { date, employee: employeeScope(p) }, _count: true }),
    ]);

    res.json({
      ...pagedResult(
        rows.map((r) => ({ id: r.id, name: r.employee.fullName, initials: r.employee.initials, role: `${r.employee.position.title} · ${r.employee.department.name}`, isOperational: r.employee.isOperational, status: r.status, checkIn: r.checkIn, checkOut: r.checkOut })),
        total,
        params,
      ),
      date,
      summary: Object.fromEntries(summary.map((s) => [s.status, s._count])),
    });
  }),
);

const markSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  status: z.nativeEnum(AttendanceStatus),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});
router.post(
  '/',
  requireModule('attendance', 'manage'),
  asyncHandler(async (req, res) => {
    const data = markSchema.parse(req.body);
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);
    const rec = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: data.employeeId, date } },
      create: { employeeId: data.employeeId, date, status: data.status, checkIn: data.checkIn ?? null, checkOut: data.checkOut ?? null, note: data.note ?? null },
      update: { status: data.status, checkIn: data.checkIn ?? null, checkOut: data.checkOut ?? null, note: data.note ?? null },
    });
    await audit(auditContextFromReq(req), { action: 'UPDATE', entityType: 'Attendance', entityId: rec.id, summary: `Marked ${data.status} for ${date.toDateString()}`, newValue: { status: data.status } });
    res.json(rec);
  }),
);

export default router;
