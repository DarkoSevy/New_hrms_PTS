import { Router } from 'express';
import { z } from 'zod';
import { ContractKind, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { audit, auditContextFromReq, snapshot } from '../lib/audit.js';
import { parseListParams, pagedResult } from '../lib/pagination.js';
import { exportFormat, sendCsv, sendPdf } from '../lib/export.js';
import { startOfToday, addDays, fmtDate } from '../lib/dates.js';
import { NotFound } from '../lib/errors.js';

const router = Router();

function eventFor(c: { endDate: Date | null; probationEndDate: Date | null; kind: ContractKind }, today: Date) {
  const days = (target: Date | null) => (target ? Math.ceil((target.getTime() - today.getTime()) / 86400000) : null);
  const probD = days(c.probationEndDate);
  if (probD !== null && probD >= 0 && probD <= 60) {
    return { label: `Probation ends in ${probD} days`, band: probD <= 7 ? 'critical' : probD <= 14 ? 'warn' : 'ok', kind: 'probation' as const, dueInDays: probD };
  }
  const endD = days(c.endDate);
  if (endD === null) return { label: 'No action', band: 'ok' as const, kind: 'none' as const, dueInDays: null };
  if (endD < 0) return { label: `Expired ${Math.abs(endD)} days ago`, band: 'critical' as const, kind: 'expiry' as const, dueInDays: endD };
  return { label: `Expires in ${endD} days`, band: endD <= 7 ? 'critical' : endD <= 30 ? 'warn' : 'ok', kind: 'expiry' as const, dueInDays: endD };
}

router.get(
  '/',
  requireModule('contracts', 'view'),
  asyncHandler(async (req, res) => {
    const today = startOfToday();
    const in60 = addDays(today, 60);
    const params = parseListParams(req, { sortable: ['endDate', 'startDate'], filterable: ['kind', 'band'], defaultSort: 'endDate:asc' });

    const where: Prisma.ContractWhereInput = { isActive: true };
    if (params.filters.kind) where.kind = params.filters.kind as ContractKind;
    if (params.q) where.employee = { fullName: { contains: params.q, mode: 'insensitive' } };

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { endDate: params.sortDir },
      include: { employee: { select: { fullName: true, initials: true, position: { select: { title: true } }, department: { select: { name: true } } } } },
    });

    const mapped = contracts.map((c) => {
      const ev = eventFor(c, today);
      return {
        id: c.id,
        name: c.employee.fullName,
        initials: c.employee.initials,
        role: `${c.employee.position.title} · ${c.employee.department.name}`,
        kind: c.kind,
        startDate: c.startDate,
        endDate: c.endDate,
        period: c.endDate ? `${fmtDate(c.startDate)} – ${fmtDate(c.endDate)}` : `From ${fmtDate(c.startDate)}`,
        signedCopyOnFile: c.signedCopyOnFile,
        version: c.version,
        event: ev.label,
        band: ev.band,
        eventKind: ev.kind,
        dueInDays: ev.dueInDays,
      };
    });
    const filtered = params.filters.band ? mapped.filter((m) => m.band === params.filters.band) : mapped;

    if (exportFormat(req.query.export)) {
      const columns = [
        { header: 'Employee', value: (r: (typeof filtered)[number]) => r.name, width: 1.6 },
        { header: 'Role', value: (r: (typeof filtered)[number]) => r.role, width: 1.6 },
        { header: 'Type', value: (r: (typeof filtered)[number]) => r.kind, width: 1 },
        { header: 'Period', value: (r: (typeof filtered)[number]) => r.period, width: 1.8 },
        { header: 'Status', value: (r: (typeof filtered)[number]) => r.event, width: 1.4 },
        { header: 'Signed copy', value: (r: (typeof filtered)[number]) => (r.signedCopyOnFile ? 'Yes' : 'Missing'), width: 0.8 },
      ];
      await audit(auditContextFromReq(req), { action: 'EXPORT', entityType: 'Contract', summary: `Exported ${filtered.length} contracts` });
      if (req.query.export === 'csv') return sendCsv(res, 'contracts', columns, filtered);
      return sendPdf(res, 'contracts', { title: 'Contract register', columns, rows: filtered });
    }

    const [expiring60, probationDue, missingSigned, fixedTerm, reminderRules] = await Promise.all([
      prisma.contract.count({ where: { isActive: true, endDate: { gte: today, lte: in60 } } }),
      prisma.contract.count({ where: { isActive: true, probationEndDate: { gte: today, lte: in60 } } }),
      prisma.contract.count({ where: { isActive: true, signedCopyOnFile: false } }),
      prisma.contract.count({ where: { isActive: true, kind: ContractKind.FIXED_TERM } }),
      prisma.contractReminderRule.findMany({ where: { isActive: true }, orderBy: { offsetDays: 'desc' } }),
    ]);

    // Manual pagination over the computed list.
    const total = filtered.length;
    const page = filtered.slice(params.skip, params.skip + params.take);
    res.json({
      ...pagedResult(page, total, params),
      kpis: { expiring60, probationDue, missingSigned, fixedTerm },
      reminderRules,
    });
  }),
);

const upsertSchema = z.object({
  employeeId: z.string(),
  kind: z.nativeEnum(ContractKind),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  probationEndDate: z.string().nullable().optional(),
  signedCopyOnFile: z.boolean().optional(),
  version: z.number().int().optional(),
});

router.post(
  '/',
  requireModule('contracts', 'manage'),
  asyncHandler(async (req, res) => {
    const data = upsertSchema.parse(req.body);
    // Supersede prior active contracts for this employee.
    await prisma.contract.updateMany({ where: { employeeId: data.employeeId, isActive: true }, data: { isActive: false } });
    const created = await prisma.contract.create({
      data: {
        employeeId: data.employeeId,
        kind: data.kind,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        probationEndDate: data.probationEndDate ? new Date(data.probationEndDate) : null,
        signedCopyOnFile: data.signedCopyOnFile ?? false,
        version: data.version ?? 1,
      },
    });
    await audit(auditContextFromReq(req), { action: 'CREATE', entityType: 'Contract', entityId: created.id, summary: `Recorded ${created.kind} contract`, newValue: snapshot(created, ['kind', 'startDate', 'endDate', 'signedCopyOnFile']) });
    res.status(201).json(created);
  }),
);

router.put(
  '/:id',
  requireModule('contracts', 'manage'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound('Contract not found');
    const data = upsertSchema.partial().parse(req.body);
    const updated = await prisma.contract.update({
      where: { id: req.params.id },
      data: {
        ...(data.kind ? { kind: data.kind } : {}),
        ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate ? new Date(data.endDate) : null } : {}),
        ...(data.probationEndDate !== undefined ? { probationEndDate: data.probationEndDate ? new Date(data.probationEndDate) : null } : {}),
        ...(data.signedCopyOnFile !== undefined ? { signedCopyOnFile: data.signedCopyOnFile } : {}),
        ...(data.version !== undefined ? { version: data.version } : {}),
      },
    });
    await audit(auditContextFromReq(req), { action: 'UPDATE', entityType: 'Contract', entityId: updated.id, summary: `Updated contract`, previousValue: snapshot(existing, ['endDate', 'signedCopyOnFile']), newValue: snapshot(updated, ['endDate', 'signedCopyOnFile']) });
    res.json(updated);
  }),
);

export default router;
