import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule, requireCompensationAccess } from '../middleware/rbac.js';
import { employeeScope, canReadEmployee } from '../rbac/scope.js';
import { canViewCompensation } from '../rbac/matrix.js';
import { parseListParams, pagedResult, orderByOrDefault } from '../lib/pagination.js';
import { exportFormat, sendCsv, sendPdf } from '../lib/export.js';
import { audit, auditContextFromReq, snapshot } from '../lib/audit.js';
import { Forbidden, NotFound } from '../lib/errors.js';
import { evaluateRosterEligibility } from '../services/compliance.js';

const router = Router();

function initialsOf(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// List — scoped, paginated, filtered, sorted, searchable, exportable.
// ---------------------------------------------------------------------------
router.get(
  '/',
  requireModule('people', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const params = parseListParams(req, {
      sortable: ['fullName', 'employeeCode', 'hireDate', 'createdAt'],
      filterable: ['departmentId', 'statusId', 'isOperational', 'employmentTypeId'],
      defaultSort: 'fullName:asc',
    });

    const filters: Prisma.EmployeeWhereInput = {};
    if (params.q) {
      filters.OR = [
        { fullName: { contains: params.q, mode: 'insensitive' } },
        { employeeCode: { contains: params.q, mode: 'insensitive' } },
        { department: { name: { contains: params.q, mode: 'insensitive' } } },
        { position: { title: { contains: params.q, mode: 'insensitive' } } },
      ];
    }
    if (params.filters.departmentId) filters.departmentId = params.filters.departmentId;
    if (params.filters.statusId) filters.statusId = params.filters.statusId;
    if (params.filters.employmentTypeId) filters.employmentTypeId = params.filters.employmentTypeId;
    if (params.filters.isOperational) filters.isOperational = params.filters.isOperational === 'true';

    const where: Prisma.EmployeeWhereInput = { AND: [employeeScope(p), filters] };

    const select = {
      id: true,
      employeeCode: true,
      fullName: true,
      initials: true,
      avatarUrl: true,
      isOperational: true,
      workLocation: true,
      hireDate: true,
      department: { select: { id: true, name: true } },
      position: { select: { id: true, title: true } },
      status: { select: { id: true, name: true } },
      employmentType: { select: { id: true, name: true } },
      rosterEligibility: { select: { isRosterable: true, reasons: true } },
    } satisfies Prisma.EmployeeSelect;

    if (exportFormat(req.query.export)) {
      const rows = await prisma.employee.findMany({ where, orderBy: orderByOrDefault(params, { fullName: 'asc' }), select, take: 5000 });
      const columns = [
        { header: 'Employee ID', value: (r: (typeof rows)[number]) => r.employeeCode, width: 1 },
        { header: 'Name', value: (r: (typeof rows)[number]) => r.fullName, width: 1.6 },
        { header: 'Department', value: (r: (typeof rows)[number]) => r.department.name, width: 1.2 },
        { header: 'Position', value: (r: (typeof rows)[number]) => r.position.title, width: 1.4 },
        { header: 'Type', value: (r: (typeof rows)[number]) => r.employmentType.name, width: 1 },
        { header: 'Status', value: (r: (typeof rows)[number]) => r.status.name, width: 1 },
        { header: 'Rosterable', value: (r: (typeof rows)[number]) => (r.isOperational ? (r.rosterEligibility?.isRosterable ? 'Yes' : 'No') : 'n/a'), width: 0.8 },
      ];
      await audit(auditContextFromReq(req), { action: 'EXPORT', entityType: 'Employee', summary: `Exported ${rows.length} employee records` });
      if (req.query.export === 'csv') return sendCsv(res, 'employees', columns, rows);
      return sendPdf(res, 'employees', { title: 'Employee directory', columns, rows });
    }

    const [rows, total, facets] = await Promise.all([
      prisma.employee.findMany({ where, skip: params.skip, take: params.take, orderBy: orderByOrDefault(params, { fullName: 'asc' }), select }),
      prisma.employee.count({ where }),
      prisma.employee.groupBy({ by: ['departmentId'], where: employeeScope(p), _count: true }),
    ]);
    res.json({ ...pagedResult(rows, total, params), facets });
  }),
);

// ---------------------------------------------------------------------------
// Detail — full master record (compensation excluded here; separate endpoint).
// ---------------------------------------------------------------------------
router.get(
  '/:id',
  requireModule('people', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        department: true,
        position: true,
        status: true,
        employmentType: true,
        directManager: { select: { id: true, fullName: true } },
        dependents: { orderBy: { createdAt: 'asc' } },
        nextOfKin: { orderBy: { isPrimary: 'desc' } },
        medicalEnrollment: { include: { scheme: true } },
        allowances: true,
        contracts: { orderBy: { startDate: 'desc' } },
        documents: { include: { documentType: true }, orderBy: { createdAt: 'desc' } },
        rosterEligibility: true,
      },
    });
    if (!employee) throw NotFound('Employee not found');
    if (!canReadEmployee(p, { id: employee.id, directManagerId: employee.directManagerId })) {
      throw Forbidden('You cannot view this employee record.');
    }

    // Sensitive documents are hidden from non-HR viewers (managers/self).
    const canSeeSensitive = p.role === 'HR_ADMINISTRATOR' || p.role === 'HR_OFFICER';
    const documents = employee.documents.map((d) => ({
      id: d.id,
      name: d.documentType.name,
      category: d.documentType.category,
      fileName: canSeeSensitive || !d.isSensitive ? d.fileName : null,
      issueDate: d.issueDate,
      expiryDate: d.expiryDate,
      version: d.version,
      isSensitive: d.isSensitive,
      restricted: d.isSensitive && !canSeeSensitive,
    }));

    res.json({
      ...employee,
      compensation: undefined, // never inlined — fetched via /compensation with its own guard
      documents,
      canViewCompensation: canViewCompensation(p.role),
    });
  }),
);

// ---------------------------------------------------------------------------
// Compensation — restricted at the query level. The Compensation row is only
// ever fetched inside this handler, which is gated on requireCompensationAccess.
// ---------------------------------------------------------------------------
router.get(
  '/:id/compensation',
  requireModule('people', 'view'),
  requireCompensationAccess,
  asyncHandler(async (req, res) => {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      select: { id: true, fullName: true, compensation: true, allowances: true },
    });
    if (!employee) throw NotFound('Employee not found');

    // Sensitive read — always audited.
    await audit(auditContextFromReq(req), {
      action: 'READ',
      entityType: 'Compensation',
      entityId: employee.id,
      summary: `Viewed compensation for ${employee.fullName}`,
    });

    res.json({
      employeeId: employee.id,
      compensation: employee.compensation,
      allowances: employee.allowances,
    });
  }),
);

const compUpsertSchema = z.object({
  basicSalary: z.number().nonnegative(),
  grade: z.string().optional().nullable(),
  effectiveFrom: z.string().optional().nullable(),
  lastRevision: z.string().optional().nullable(),
  payrollStatus: z.string().optional().nullable(),
});
router.put(
  '/:id/compensation',
  requireModule('people', 'manage'),
  requireCompensationAccess,
  asyncHandler(async (req, res) => {
    const data = compUpsertSchema.parse(req.body);
    const existing = await prisma.compensation.findUnique({ where: { employeeId: req.params.id } });
    const payload = {
      basicSalary: new Prisma.Decimal(data.basicSalary),
      grade: data.grade ?? null,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
      lastRevision: data.lastRevision ?? null,
      payrollStatus: data.payrollStatus ?? null,
    };
    const updated = await prisma.compensation.upsert({
      where: { employeeId: req.params.id },
      create: { employeeId: req.params.id, ...payload },
      update: payload,
    });
    await audit(auditContextFromReq(req), {
      action: 'UPDATE',
      entityType: 'Compensation',
      entityId: req.params.id,
      summary: `Updated compensation`,
      previousValue: existing ? { basicSalary: existing.basicSalary.toString(), grade: existing.grade } : null,
      newValue: { basicSalary: updated.basicSalary.toString(), grade: updated.grade },
    });
    res.json(updated);
  }),
);

// ---------------------------------------------------------------------------
// Create / update employee master record.
// ---------------------------------------------------------------------------
const createSchema = z.object({
  employeeCode: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  nationalId: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  workLocation: z.string().optional().nullable(),
  departmentId: z.string().min(1),
  positionId: z.string().min(1),
  employmentTypeId: z.string().min(1),
  statusId: z.string().min(1),
  isOperational: z.boolean().optional(),
  directManagerId: z.string().optional().nullable(),
  operationalSupervisor: z.string().optional().nullable(),
  hireDate: z.string(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
});

router.post(
  '/',
  requireModule('people', 'manage'),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const created = await prisma.employee.create({
      data: {
        ...data,
        fullName: `${data.firstName} ${data.lastName}`,
        initials: initialsOf(data.firstName, data.lastName),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        hireDate: new Date(data.hireDate),
        directManagerId: data.directManagerId || null,
      },
    });
    await prisma.rosterEligibility.create({ data: { employeeId: created.id, isRosterable: true, reasons: [] } });
    await evaluateRosterEligibility(created.id);
    await audit(auditContextFromReq(req), {
      action: 'CREATE',
      entityType: 'Employee',
      entityId: created.id,
      summary: `Created employee ${created.fullName} (${created.employeeCode})`,
      newValue: snapshot(created, ['employeeCode', 'fullName', 'departmentId', 'positionId']),
    });
    res.status(201).json(created);
  }),
);

router.put(
  '/:id',
  requireModule('people', 'manage'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound('Employee not found');
    const data = createSchema.partial().parse(req.body);
    const patch: Prisma.EmployeeUpdateInput = { ...data } as Prisma.EmployeeUpdateInput;
    if (data.firstName || data.lastName) {
      const first = data.firstName ?? existing.firstName;
      const last = data.lastName ?? existing.lastName;
      patch.fullName = `${first} ${last}`;
      patch.initials = initialsOf(first, last);
    }
    if (data.dateOfBirth !== undefined) patch.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.hireDate) patch.hireDate = new Date(data.hireDate);
    const updated = await prisma.employee.update({ where: { id: req.params.id }, data: patch });
    await evaluateRosterEligibility(updated.id);
    await audit(auditContextFromReq(req), {
      action: 'UPDATE',
      entityType: 'Employee',
      entityId: updated.id,
      summary: `Updated employee ${updated.fullName}`,
      previousValue: snapshot(existing, ['statusId', 'positionId', 'departmentId', 'workLocation', 'directManagerId']),
      newValue: snapshot(updated, ['statusId', 'positionId', 'departmentId', 'workLocation', 'directManagerId']),
    });
    res.json(updated);
  }),
);

// ---------------------------------------------------------------------------
// Dependents & next of kin (medical insurance section).
// ---------------------------------------------------------------------------
const dependentSchema = z.object({
  name: z.string().min(1),
  relation: z.string().min(1),
  dateOfBirth: z.string().optional().nullable(),
  memberId: z.string().optional().nullable(),
  status: z.string().optional(),
});

router.post(
  '/:id/dependents',
  requireModule('people', 'manage'),
  asyncHandler(async (req, res) => {
    const data = dependentSchema.parse(req.body);
    const created = await prisma.dependent.create({
      data: { employeeId: req.params.id, ...data, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null },
    });
    await audit(auditContextFromReq(req), {
      action: 'CREATE', entityType: 'Dependent', entityId: created.id,
      summary: `Added dependent ${created.name} (${created.relation})`, newValue: created,
    });
    res.status(201).json(created);
  }),
);

router.delete(
  '/:id/dependents/:depId',
  requireModule('people', 'manage'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.dependent.findUnique({ where: { id: req.params.depId } });
    if (!existing) throw NotFound('Dependent not found');
    await prisma.dependent.delete({ where: { id: req.params.depId } });
    await audit(auditContextFromReq(req), {
      action: 'DELETE', entityType: 'Dependent', entityId: existing.id,
      summary: `Removed dependent ${existing.name}`, previousValue: snapshot(existing),
    });
    res.status(204).end();
  }),
);

const kinSchema = z.object({
  name: z.string().min(1),
  relation: z.string().min(1),
  phone: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  isPrimary: z.boolean().optional(),
});
router.post(
  '/:id/next-of-kin',
  requireModule('people', 'manage'),
  asyncHandler(async (req, res) => {
    const data = kinSchema.parse(req.body);
    const created = await prisma.nextOfKin.create({ data: { employeeId: req.params.id, ...data } });
    await audit(auditContextFromReq(req), {
      action: 'CREATE', entityType: 'NextOfKin', entityId: created.id,
      summary: `Added next of kin ${created.name}`, newValue: created,
    });
    res.status(201).json(created);
  }),
);

export default router;
