import { Router } from 'express';
import { z } from 'zod';
import { LeaveStage, Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { isAggregateOnly } from '../rbac/matrix.js';
import { ownedRecordScope } from '../rbac/scope.js';
import { audit, auditContextFromReq } from '../lib/audit.js';
import { BadRequest, Forbidden, NotFound, UnprocessableEntity } from '../lib/errors.js';
import { exportFormat, sendCsv, sendPdf } from '../lib/export.js';
import { applyBalanceTransition, coverCheck, leaveDays, nextLeaveReference } from '../services/leave.js';
import { fmtDate } from '../lib/dates.js';

const router = Router();
const YEAR = new Date().getFullYear();

function stageLabel(s: LeaveStage) {
  return { EMPLOYEE_REQUEST: 'Employee request', SUPERVISOR: 'Supervisor', HR_VALIDATION: 'HR validation', APPROVED: 'Approved', REJECTED: 'Rejected', CANCELLED: 'Cancelled' }[s];
}

// ---------------------------------------------------------------------------
// Self view — the employee's own balances, history and entitlements.
// ---------------------------------------------------------------------------
router.get(
  '/self',
  requireModule('leave', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    if (!p.employeeId) throw BadRequest('No employee record is linked to your account.');
    const [balances, history, leaveTypes] = await Promise.all([
      prisma.leaveBalance.findMany({ where: { employeeId: p.employeeId, year: YEAR }, include: { leaveType: true } }),
      prisma.leaveRequest.findMany({ where: { employeeId: p.employeeId }, include: { leaveType: true }, orderBy: { filedAt: 'desc' }, take: 20 }),
      prisma.leaveType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    ]);
    const annual = balances.find((b) => b.leaveType.name === 'Annual');
    res.json({
      annual: annual ? { entitlement: annual.entitlement, taken: annual.taken, pending: annual.pending, remaining: annual.entitlement - annual.taken - annual.pending } : null,
      balances: balances.map((b) => ({ type: b.leaveType.name, entitlement: b.entitlement, taken: b.taken, pending: b.pending })),
      history: history.map((h) => ({ id: h.id, reference: h.reference, type: h.leaveType.name, days: h.days, dates: `${fmtDate(h.startDate)} – ${fmtDate(h.endDate)}`, stage: h.stage, stageLabel: stageLabel(h.stage) })),
      types: leaveTypes.map((t) => ({ id: t.id, name: t.name, entitlementLabel: t.entitlementLabel, rule: t.rule, appliesTo: t.appliesTo })),
    });
  }),
);

// ---------------------------------------------------------------------------
// Executive aggregate — no individual records.
// ---------------------------------------------------------------------------
router.get(
  '/exec',
  requireModule('leave', 'view'),
  asyncHandler(async (_req, res) => {
    const departments = await prisma.department.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
    const byDept = await Promise.all(
      departments.map(async (d) => {
        const agg = await prisma.leaveBalance.aggregate({
          where: { year: YEAR, employee: { departmentId: d.id } },
          _sum: { entitlement: true, taken: true },
        });
        const ent = agg._sum.entitlement ?? 0;
        const taken = agg._sum.taken ?? 0;
        return { name: d.name, used: ent ? Math.round((taken / ent) * 100) : 0, days: taken };
      }),
    );
    const cover = await coverCheck();
    const accruedUnused = await prisma.leaveBalance.aggregate({ where: { year: YEAR, leaveType: { name: 'Annual' } }, _sum: { entitlement: true, taken: true } });
    res.json({
      byDept: byDept.filter((d) => d.days > 0),
      cover,
      accruedUnused: (accruedUnused._sum.entitlement ?? 0) - (accruedUnused._sum.taken ?? 0),
    });
  }),
);

router.get('/coverage', requireModule('leave', 'view'), asyncHandler(async (_req, res) => res.json(await coverCheck())));

// ---------------------------------------------------------------------------
// Main queue — scoped list + detail data.
// ---------------------------------------------------------------------------
router.get(
  '/',
  requireModule('leave', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    if (isAggregateOnly(p.role)) throw Forbidden('Senior Management sees aggregate leave only.');

    const scope = ownedRecordScope(p) as Prisma.LeaveRequestWhereInput;
    const filter = (typeof req.query.filter === 'string' ? req.query.filter : 'Pending');
    const stageWhere: Prisma.LeaveRequestWhereInput =
      filter === 'All' ? {} :
      filter === 'Decided' ? { stage: { in: [LeaveStage.APPROVED, LeaveStage.REJECTED] } } :
      filter === 'Operations' ? { employee: { isOperational: true } } :
      { stage: { in: [LeaveStage.SUPERVISOR, LeaveStage.HR_VALIDATION] } };

    const where: Prisma.LeaveRequestWhereInput = { AND: [scope, stageWhere] };

    const rows = await prisma.leaveRequest.findMany({
      where,
      orderBy: { filedAt: 'asc' },
      include: {
        employee: { select: { fullName: true, initials: true, isOperational: true, position: { select: { title: true } }, department: { select: { name: true } } } },
        leaveType: { select: { name: true } },
      },
    });

    if (exportFormat(req.query.export)) {
      const columns = [
        { header: 'Reference', value: (r: (typeof rows)[number]) => r.reference, width: 1 },
        { header: 'Employee', value: (r: (typeof rows)[number]) => r.employee.fullName, width: 1.4 },
        { header: 'Type', value: (r: (typeof rows)[number]) => r.leaveType.name, width: 0.8 },
        { header: 'Days', value: (r: (typeof rows)[number]) => r.days, width: 0.5 },
        { header: 'Dates', value: (r: (typeof rows)[number]) => `${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}`, width: 1.6 },
        { header: 'Stage', value: (r: (typeof rows)[number]) => stageLabel(r.stage), width: 1 },
      ];
      await audit(auditContextFromReq(req), { action: 'EXPORT', entityType: 'LeaveRequest', summary: `Exported ${rows.length} leave requests` });
      if (req.query.export === 'csv') return sendCsv(res, 'leave', columns, rows);
      return sendPdf(res, 'leave', { title: 'Leave requests', columns, rows });
    }

    const [awaiting, onLeaveToday, leaveTypes, cover] = await Promise.all([
      prisma.leaveRequest.count({ where: { AND: [scope, { stage: { in: [LeaveStage.SUPERVISOR, LeaveStage.HR_VALIDATION] } }] } }),
      prisma.leaveRequest.count({ where: { stage: LeaveStage.APPROVED, startDate: { lte: new Date() }, endDate: { gte: new Date() } } }),
      prisma.leaveType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      coverCheck(),
    ]);

    res.json({
      data: rows.map((r) => ({
        id: r.id, reference: r.reference, name: r.employee.fullName, initials: r.employee.initials,
        role: `${r.employee.position.title} · ${r.employee.department.name}`, type: r.leaveType.name, days: r.days,
        dates: `${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}`, stage: r.stage, stageLabel: stageLabel(r.stage),
        reason: r.reason, coverNote: r.coverNote, isOperational: r.employee.isOperational,
      })),
      kpis: { awaiting, onLeaveToday },
      leaveTypes: leaveTypes.map((t) => ({ id: t.id, name: t.name, entitlementLabel: t.entitlementLabel, rule: t.rule })),
      cover,
      canDecide: p.role === Role.MANAGER || p.role === Role.HR_ADMINISTRATOR || p.role === Role.HR_OFFICER,
    });
  }),
);

// ---------------------------------------------------------------------------
// File a leave request (employee, or HR on behalf).
// ---------------------------------------------------------------------------
const createSchema = z.object({
  leaveTypeId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(1),
  employeeId: z.string().optional(),
  coverNote: z.string().optional().nullable(),
});
router.post(
  '/',
  requireModule('leave', 'manage'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const data = createSchema.parse(req.body);
    const employeeId = p.role === Role.EMPLOYEE ? p.employeeId : (data.employeeId ?? p.employeeId);
    if (!employeeId) throw BadRequest('No employee to file for.');

    const [employee, type] = await Promise.all([
      prisma.employee.findUnique({ where: { id: employeeId } }),
      prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } }),
    ]);
    if (!employee || !type) throw BadRequest('Invalid employee or leave type.');

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) throw BadRequest('End date cannot be before the start date.');
    const days = leaveDays(start, end);

    // Gender-scoped types.
    if (type.appliesTo === 'FEMALE' && employee.gender !== 'Female') throw UnprocessableEntity(`${type.name} leave applies to female staff.`);
    if (type.appliesTo === 'MALE' && employee.gender !== 'Male') throw UnprocessableEntity(`${type.name} leave applies to male staff.`);

    // Sick certificate threshold.
    if (type.requiresCertificateAfterDays != null && days > type.requiresCertificateAfterDays) {
      // Certificate handled via document attachment; flag if not provided.
      // (Kept as a soft rule — the request is accepted and HR validates the certificate.)
    }

    // Annual balance guard.
    if (type.name === 'Annual' && type.defaultEntitlementDays != null) {
      const bal = await prisma.leaveBalance.findUnique({ where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId: type.id, year: YEAR } } });
      const remaining = bal ? bal.entitlement - bal.taken - bal.pending : type.defaultEntitlementDays;
      if (days > remaining) throw UnprocessableEntity(`Only ${remaining} annual day(s) remaining; requested ${days}.`);
    }

    const reference = await nextLeaveReference(YEAR);
    const created = await prisma.leaveRequest.create({
      data: { reference, employeeId, leaveTypeId: type.id, startDate: start, endDate: end, days, reason: data.reason, coverNote: data.coverNote ?? null, stage: LeaveStage.SUPERVISOR },
    });
    await applyBalanceTransition({ employeeId, leaveTypeId: type.id, year: YEAR, days, from: null, to: LeaveStage.SUPERVISOR, entitlement: type.defaultEntitlementDays ?? 0 });
    await audit(auditContextFromReq(req), { action: 'CREATE', entityType: 'LeaveRequest', entityId: created.id, summary: `Filed ${type.name} leave ${reference} (${days}d)`, newValue: { reference, type: type.name, days } });
    res.status(201).json(created);
  }),
);

// ---------------------------------------------------------------------------
// Decision — supervisor and HR validation stages.
// ---------------------------------------------------------------------------
const decisionSchema = z.object({ action: z.enum(['approve', 'reject']), comment: z.string().optional().nullable() });
router.post(
  '/:id/decision',
  requireModule('leave', 'manage'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const { action, comment } = decisionSchema.parse(req.body);
    const lr = await prisma.leaveRequest.findUnique({ where: { id: req.params.id }, include: { employee: true, leaveType: true } });
    if (!lr) throw NotFound('Leave request not found');

    const isManager = p.role === Role.MANAGER;
    const isHR = p.role === Role.HR_ADMINISTRATOR || p.role === Role.HR_OFFICER;

    // Stage + role enforcement.
    if (lr.stage === LeaveStage.SUPERVISOR) {
      if (!isManager && !isHR) throw Forbidden('Only the supervisor or HR can act at this stage.');
      if (isManager && lr.employee.directManagerId !== p.employeeId) throw Forbidden('You can only decide leave for your direct reports.');
    } else if (lr.stage === LeaveStage.HR_VALIDATION) {
      if (!isHR) throw Forbidden('Only HR can validate at this stage.');
    } else {
      throw UnprocessableEntity('This request has already been decided.');
    }

    // Unpaid leave requires HR Administrator.
    if (lr.leaveType.requiresAdminApproval && p.role !== Role.HR_ADMINISTRATOR && action === 'approve') {
      throw Forbidden(`${lr.leaveType.name} leave can only be approved by the HR Administrator.`);
    }

    let nextStage: LeaveStage;
    if (action === 'reject') {
      nextStage = LeaveStage.REJECTED;
    } else if (lr.stage === LeaveStage.SUPERVISOR) {
      nextStage = LeaveStage.HR_VALIDATION;
    } else {
      nextStage = LeaveStage.APPROVED;
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: lr.id },
      data: {
        stage: nextStage,
        ...(lr.stage === LeaveStage.SUPERVISOR
          ? { supervisorDecisionById: p.userId, supervisorDecisionAt: new Date(), supervisorComment: comment ?? null }
          : { hrDecisionById: p.userId, hrDecisionAt: new Date(), hrComment: comment ?? null }),
      },
    });

    if (nextStage === LeaveStage.APPROVED || nextStage === LeaveStage.REJECTED) {
      await applyBalanceTransition({ employeeId: lr.employeeId, leaveTypeId: lr.leaveTypeId, year: YEAR, days: lr.days, from: lr.stage, to: nextStage, entitlement: lr.leaveType.defaultEntitlementDays ?? 0 });
    }

    await audit(auditContextFromReq(req), {
      action: action === 'approve' ? 'APPROVE' : 'REJECT',
      entityType: 'LeaveRequest', entityId: lr.id,
      summary: `${action === 'approve' ? 'Approved' : 'Declined'} ${lr.reference} at ${stageLabel(lr.stage)} → ${stageLabel(nextStage)}`,
      previousValue: { stage: lr.stage }, newValue: { stage: nextStage, comment },
    });
    res.json(updated);
  }),
);

export default router;
