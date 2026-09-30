import { Router } from 'express';
import { z } from 'zod';
import { PayrollInputState, PayrollPeriodStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { audit, auditContextFromReq } from '../lib/audit.js';
import { BadRequest, NotFound, Conflict } from '../lib/errors.js';
import { exportFormat, sendCsv, sendPdf } from '../lib/export.js';

const router = Router();

// Payroll is restricted (matrix: HR_ADMINISTRATOR only). Non-admins get 403 and
// the client renders the "restricted module" state.
router.use(requireModule('payroll', 'view'));

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

async function currentPeriod() {
  return prisma.payrollPeriod.findFirst({ where: { status: PayrollPeriodStatus.OPEN }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const period = await currentPeriod();
    if (!period) return res.json({ period: null, inputs: [], kpis: {}, handover: [] });

    const inputs = await prisma.payrollInput.findMany({
      where: { periodId: period.id },
      include: { employee: { select: { fullName: true, initials: true, position: { select: { title: true } }, department: { select: { name: true } } } } },
      orderBy: { createdAt: 'asc' },
    });

    const money = (n: Prisma.Decimal | number) => `RWF ${Number(n).toLocaleString('en-US')}`;
    const decorated = inputs.map((i) => ({
      id: i.id, name: i.employee.fullName, initials: i.employee.initials, role: `${i.employee.position.title} · ${i.employee.department.name}`,
      item: i.item, basis: i.basis, state: i.state, isDeduction: i.isDeduction, isValueChange: i.isValueChange,
      amount: !i.isValueChange ? 'No value change' : `${i.isDeduction ? '− ' : '+ '}${money(i.amount)}`,
    }));

    if (exportFormat(req.query.export)) {
      const columns = [
        { header: 'Employee', value: (r: (typeof decorated)[number]) => r.name, width: 1.4 },
        { header: 'Item', value: (r: (typeof decorated)[number]) => r.item, width: 1.6 },
        { header: 'Amount', value: (r: (typeof decorated)[number]) => r.amount, width: 1 },
        { header: 'Basis', value: (r: (typeof decorated)[number]) => r.basis, width: 2 },
        { header: 'State', value: (r: (typeof decorated)[number]) => r.state, width: 1 },
      ];
      await audit(auditContextFromReq(req), { action: 'EXPORT', entityType: 'PayrollInput', summary: `Exported ${decorated.length} payroll inputs` });
      if (req.query.export === 'csv') return sendCsv(res, 'payroll-inputs', columns, decorated);
      return sendPdf(res, 'payroll-inputs', { title: `Payroll inputs — ${MONTHS[period.month - 1]} ${period.year}`, columns, rows: decorated });
    }

    const approvedAllow = inputs.filter((i) => i.state === PayrollInputState.APPROVED && !i.isDeduction && i.isValueChange).reduce((s, i) => s + Number(i.amount), 0);
    const deductions = inputs.filter((i) => i.state === PayrollInputState.APPROVED && i.isDeduction).reduce((s, i) => s + Number(i.amount), 0);
    const pending = inputs.filter((i) => i.state === PayrollInputState.PENDING_HR).length;
    const employeesOnRun = await prisma.employee.count({ where: { status: { countsAsActive: true } } });

    res.json({
      period: { id: period.id, label: `${MONTHS[period.month - 1]} ${period.year}`, status: period.status, cutoffDate: period.cutoffDate },
      inputs: decorated,
      kpis: { employeesOnRun, pending, cutoff: period.cutoffDate },
      handover: [
        { label: 'Approved allowances & overtime', value: money(approvedAllow) },
        { label: 'Deductions — unpaid leave etc.', value: `− ${money(deductions)}` },
        { label: 'Net adjustment to base run', value: money(approvedAllow - deductions) },
      ],
    });
  }),
);

const inputSchema = z.object({
  employeeId: z.string(),
  item: z.string().min(1),
  amount: z.number(),
  isDeduction: z.boolean().optional(),
  isValueChange: z.boolean().optional(),
  basis: z.string().min(1),
  sourceRef: z.string().optional().nullable(),
});
router.post(
  '/inputs',
  requireModule('payroll', 'manage'),
  asyncHandler(async (req, res) => {
    const period = await currentPeriod();
    if (!period) throw BadRequest('No open payroll period.');
    const data = inputSchema.parse(req.body);
    const created = await prisma.payrollInput.create({
      data: { periodId: period.id, employeeId: data.employeeId, item: data.item, amount: new Prisma.Decimal(data.amount), isDeduction: data.isDeduction ?? false, isValueChange: data.isValueChange ?? true, basis: data.basis, sourceRef: data.sourceRef ?? null },
    });
    await audit(auditContextFromReq(req), { action: 'CREATE', entityType: 'PayrollInput', entityId: created.id, summary: `Added payroll input: ${data.item}`, newValue: { item: data.item, amount: data.amount } });
    res.status(201).json(created);
  }),
);

router.post(
  '/inputs/:id/approve',
  requireModule('payroll', 'manage'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.payrollInput.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound('Input not found');
    if (existing.state === PayrollInputState.LOCKED) throw Conflict('This input is locked.');
    const updated = await prisma.payrollInput.update({ where: { id: req.params.id }, data: { state: PayrollInputState.APPROVED, approvedById: req.principal!.userId, approvedAt: new Date() } });
    await audit(auditContextFromReq(req), { action: 'APPROVE', entityType: 'PayrollInput', entityId: updated.id, summary: `Approved payroll input: ${updated.item}`, previousValue: { state: existing.state }, newValue: { state: updated.state } });
    res.json(updated);
  }),
);

// Lock the period and hand it to Finance — writes an immutable audit entry.
router.post(
  '/periods/:id/lock',
  requireModule('payroll', 'manage'),
  asyncHandler(async (req, res) => {
    const period = await prisma.payrollPeriod.findUnique({ where: { id: req.params.id }, include: { inputs: true } });
    if (!period) throw NotFound('Period not found');
    if (period.status === PayrollPeriodStatus.LOCKED) throw Conflict('This period is already locked.');

    const [, lockedPeriod] = await prisma.$transaction([
      prisma.payrollInput.updateMany({ where: { periodId: period.id, state: PayrollInputState.APPROVED }, data: { state: PayrollInputState.LOCKED } }),
      prisma.payrollPeriod.update({ where: { id: period.id }, data: { status: PayrollPeriodStatus.LOCKED, lockedAt: new Date(), lockedById: req.principal!.userId } }),
    ]);

    const approved = period.inputs.filter((i) => i.state === PayrollInputState.APPROVED);
    await audit(auditContextFromReq(req), {
      action: 'LOCK', entityType: 'PayrollPeriod', entityId: period.id,
      summary: `Locked ${MONTHS[period.month - 1]} ${period.year} payroll and sent to Finance (${approved.length} inputs)`,
      newValue: { lockedAt: lockedPeriod.lockedAt, approvedInputs: approved.length, total: approved.reduce((s, i) => s + Number(i.amount) * (i.isDeduction ? -1 : 1), 0) },
    });
    res.json(lockedPeriod);
  }),
);

export default router;
