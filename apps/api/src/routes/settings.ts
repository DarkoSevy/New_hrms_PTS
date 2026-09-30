import { Router } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { AppliesTo, ContractKind, ReminderKind, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { audit, auditContextFromReq, snapshot } from '../lib/audit.js';
import { NotFound } from '../lib/errors.js';

const router = Router();

// All configuration is HR Administrator only.
router.use(requireModule('admin', 'view'));

/**
 * Register list/create/update/delete for a configurable reference collection.
 * Everything an administrator can tune — leave types & entitlements, approval
 * windows, training cycles, request SLAs, document types, statuses, schemes —
 * lives in data and is edited through these endpoints.
 */
function registerCollection(opts: {
  path: string;
  entity: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delegate: any;
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  orderBy?: Record<string, 'asc' | 'desc'>;
  label: (row: Record<string, unknown>) => string;
  softDelete?: boolean;
}) {
  router.get(
    `/${opts.path}`,
    asyncHandler(async (_req, res) => {
      const data = await opts.delegate.findMany({ orderBy: opts.orderBy ?? { createdAt: 'asc' } });
      res.json({ data });
    }),
  );

  router.post(
    `/${opts.path}`,
    requireModule('admin', 'manage'),
    asyncHandler(async (req, res) => {
      const data = opts.createSchema.parse(req.body);
      const created = await opts.delegate.create({ data });
      await audit(auditContextFromReq(req), {
        action: 'CREATE',
        entityType: opts.entity,
        entityId: created.id,
        summary: `Created ${opts.entity}: ${opts.label(created)}`,
        newValue: created,
      });
      res.status(201).json(created);
    }),
  );

  router.put(
    `/${opts.path}/:id`,
    requireModule('admin', 'manage'),
    asyncHandler(async (req, res) => {
      const existing = await opts.delegate.findUnique({ where: { id: req.params.id } });
      if (!existing) throw NotFound(`${opts.entity} not found`);
      const data = opts.updateSchema.parse(req.body);
      const updated = await opts.delegate.update({ where: { id: req.params.id }, data });
      await audit(auditContextFromReq(req), {
        action: 'UPDATE',
        entityType: opts.entity,
        entityId: updated.id,
        summary: `Updated ${opts.entity}: ${opts.label(updated)}`,
        previousValue: snapshot(existing),
        newValue: snapshot(updated),
      });
      res.json(updated);
    }),
  );

  router.delete(
    `/${opts.path}/:id`,
    requireModule('admin', 'manage'),
    asyncHandler(async (req, res) => {
      const existing = await opts.delegate.findUnique({ where: { id: req.params.id } });
      if (!existing) throw NotFound(`${opts.entity} not found`);
      if (opts.softDelete) {
        await opts.delegate.update({ where: { id: req.params.id }, data: { isActive: false } });
      } else {
        await opts.delegate.delete({ where: { id: req.params.id } });
      }
      await audit(auditContextFromReq(req), {
        action: opts.softDelete ? 'UPDATE' : 'DELETE',
        entityType: opts.entity,
        entityId: existing.id,
        summary: `${opts.softDelete ? 'Deactivated' : 'Deleted'} ${opts.entity}: ${opts.label(existing)}`,
        previousValue: snapshot(existing),
      });
      res.status(204).end();
    }),
  );
}

// --- Leave types & entitlements ---
registerCollection({
  path: 'leave-types',
  entity: 'LeaveType',
  delegate: prisma.leaveType,
  orderBy: { sortOrder: 'asc' },
  softDelete: true,
  label: (r) => String(r.name),
  createSchema: z.object({
    name: z.string().min(1),
    defaultEntitlementDays: z.number().int().nullable().optional(),
    entitlementLabel: z.string().min(1),
    requiresCertificateAfterDays: z.number().int().nullable().optional(),
    carryForwardMaxDays: z.number().int().optional(),
    carryForwardExpiry: z.string().nullable().optional(),
    appliesTo: z.nativeEnum(AppliesTo).optional(),
    rule: z.string(),
    requiresDocument: z.boolean().optional(),
    isPaid: z.boolean().optional(),
    requiresAdminApproval: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
  updateSchema: z.object({
    name: z.string().min(1).optional(),
    defaultEntitlementDays: z.number().int().nullable().optional(),
    entitlementLabel: z.string().min(1).optional(),
    requiresCertificateAfterDays: z.number().int().nullable().optional(),
    carryForwardMaxDays: z.number().int().optional(),
    carryForwardExpiry: z.string().nullable().optional(),
    appliesTo: z.nativeEnum(AppliesTo).optional(),
    rule: z.string().optional(),
    requiresDocument: z.boolean().optional(),
    isPaid: z.boolean().optional(),
    requiresAdminApproval: z.boolean().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

// --- Document types ---
registerCollection({
  path: 'document-types',
  entity: 'DocumentType',
  delegate: prisma.documentType,
  orderBy: { sortOrder: 'asc' },
  softDelete: true,
  label: (r) => String(r.name),
  createSchema: z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    hasExpiry: z.boolean().optional(),
    mandatoryForOperational: z.boolean().optional(),
    isSensitive: z.boolean().optional(),
    blocksRosterIfExpired: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
  updateSchema: z.object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    hasExpiry: z.boolean().optional(),
    mandatoryForOperational: z.boolean().optional(),
    isSensitive: z.boolean().optional(),
    blocksRosterIfExpired: z.boolean().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

// --- Training programmes & cycles ---
registerCollection({
  path: 'training-programmes',
  entity: 'TrainingProgramme',
  delegate: prisma.trainingProgramme,
  orderBy: { sortOrder: 'asc' },
  softDelete: true,
  label: (r) => String(r.name),
  createSchema: z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    isMandatory: z.boolean().optional(),
    appliesTo: z.nativeEnum(AppliesTo).optional(),
    cycleMonths: z.number().int().nullable().optional(),
    provider: z.string().nullable().optional(),
    blocksRostering: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
  updateSchema: z.object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    isMandatory: z.boolean().optional(),
    appliesTo: z.nativeEnum(AppliesTo).optional(),
    cycleMonths: z.number().int().nullable().optional(),
    provider: z.string().nullable().optional(),
    blocksRostering: z.boolean().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

// --- Request types & SLAs ---
registerCollection({
  path: 'request-types',
  entity: 'RequestType',
  delegate: prisma.requestType,
  orderBy: { sortOrder: 'asc' },
  softDelete: true,
  label: (r) => String(r.name),
  createSchema: z.object({ name: z.string().min(1), slaDays: z.number().int(), sortOrder: z.number().int().optional() }),
  updateSchema: z.object({ name: z.string().min(1).optional(), slaDays: z.number().int().optional(), isActive: z.boolean().optional(), sortOrder: z.number().int().optional() }),
});

// --- Contract reminder windows ---
registerCollection({
  path: 'reminder-rules',
  entity: 'ContractReminderRule',
  delegate: prisma.contractReminderRule,
  orderBy: { offsetDays: 'desc' },
  softDelete: true,
  label: (r) => `${r.kind} @ ${r.offsetDays}d`,
  createSchema: z.object({
    kind: z.nativeEnum(ReminderKind),
    offsetDays: z.number().int(),
    notifyRoles: z.array(z.nativeEnum(Role)),
    action: z.string(),
    escalate: z.boolean().optional(),
  }),
  updateSchema: z.object({
    offsetDays: z.number().int().optional(),
    notifyRoles: z.array(z.nativeEnum(Role)).optional(),
    action: z.string().optional(),
    escalate: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

// --- Medical schemes & contribution split ---
registerCollection({
  path: 'medical-schemes',
  entity: 'MedicalScheme',
  delegate: prisma.medicalScheme,
  orderBy: { name: 'asc' },
  softDelete: true,
  label: (r) => String(r.name),
  createSchema: z.object({ name: z.string().min(1), employeeContribPct: z.number(), employerContribPct: z.number() }),
  updateSchema: z.object({ name: z.string().min(1).optional(), employeeContribPct: z.number().optional(), employerContribPct: z.number().optional(), isActive: z.boolean().optional() }),
});

// --- Employment types ---
registerCollection({
  path: 'employment-types',
  entity: 'EmploymentType',
  delegate: prisma.employmentType,
  orderBy: { name: 'asc' },
  softDelete: true,
  label: (r) => String(r.name),
  createSchema: z.object({ name: z.string().min(1), kind: z.nativeEnum(ContractKind) }),
  updateSchema: z.object({ name: z.string().min(1).optional(), kind: z.nativeEnum(ContractKind).optional(), isActive: z.boolean().optional() }),
});

// --- Employee statuses ---
registerCollection({
  path: 'employee-statuses',
  entity: 'EmployeeStatus',
  delegate: prisma.employeeStatus,
  orderBy: { sortOrder: 'asc' },
  label: (r) => String(r.name),
  createSchema: z.object({ name: z.string().min(1), isTerminal: z.boolean().optional(), countsAsActive: z.boolean().optional(), sortOrder: z.number().int().optional() }),
  updateSchema: z.object({ name: z.string().min(1).optional(), isTerminal: z.boolean().optional(), countsAsActive: z.boolean().optional(), sortOrder: z.number().int().optional() }),
});

// --- Shifts / work schedule templates ---
registerCollection({
  path: 'shifts',
  entity: 'Shift',
  delegate: prisma.shift,
  orderBy: { startTime: 'asc' },
  softDelete: true,
  label: (r) => String(r.name),
  createSchema: z.object({ name: z.string().min(1), startTime: z.string(), endTime: z.string() }),
  updateSchema: z.object({ name: z.string().min(1).optional(), startTime: z.string().optional(), endTime: z.string().optional(), isActive: z.boolean().optional() }),
});

// --- Global key/value system settings (driver cover floor, etc.) ---
router.get(
  '/system',
  asyncHandler(async (_req, res) => {
    const data = await prisma.systemSetting.findMany({ orderBy: { category: 'asc' } });
    res.json({ data });
  }),
);

const settingSchema = z.object({ value: z.string() });
router.put(
  '/system/:key',
  requireModule('admin', 'manage'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.systemSetting.findUnique({ where: { key: req.params.key } });
    if (!existing) throw NotFound('Setting not found');
    const { value } = settingSchema.parse(req.body);
    const updated = await prisma.systemSetting.update({ where: { key: req.params.key }, data: { value } });
    await audit(auditContextFromReq(req), {
      action: 'UPDATE',
      entityType: 'SystemSetting',
      entityId: updated.key,
      summary: `Changed setting ${updated.label} to ${value}`,
      previousValue: { value: existing.value },
      newValue: { value },
    });
    res.json(updated);
  }),
);

export default router;
