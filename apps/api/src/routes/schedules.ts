import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { employeeScope } from '../rbac/scope.js';
import { audit, auditContextFromReq } from '../lib/audit.js';
import { BadRequest, NotFound } from '../lib/errors.js';

const router = Router();

// Shifts (configurable templates) + assignments for a given date.
router.get(
  '/',
  requireModule('schedules', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const date = typeof req.query.date === 'string' ? new Date(req.query.date) : new Date();
    date.setHours(0, 0, 0, 0);

    const [shifts, assignments] = await Promise.all([
      prisma.shift.findMany({ where: { isActive: true }, orderBy: { startTime: 'asc' } }),
      prisma.shiftAssignment.findMany({
        where: { date, employee: employeeScope(p) },
        include: { shift: true, employee: { select: { id: true, fullName: true, initials: true, isOperational: true, rosterEligibility: { select: { isRosterable: true, reasons: true } } } } },
      }),
    ]);

    res.json({
      date,
      shifts,
      assignments: assignments.map((a) => ({
        id: a.id,
        shiftId: a.shiftId,
        shiftName: a.shift.name,
        employee: { id: a.employee.id, name: a.employee.fullName, initials: a.employee.initials, isOperational: a.employee.isOperational },
        rosterable: a.employee.rosterEligibility?.isRosterable ?? true,
        reasons: a.employee.rosterEligibility?.reasons ?? [],
      })),
    });
  }),
);

const assignSchema = z.object({ employeeId: z.string(), shiftId: z.string(), date: z.string() });
router.post(
  '/assign',
  requireModule('schedules', 'manage'),
  asyncHandler(async (req, res) => {
    const data = assignSchema.parse(req.body);
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    // Enforce rostering compliance: a not-rosterable operational employee cannot be assigned.
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId }, include: { rosterEligibility: true } });
    if (!employee) throw BadRequest('Unknown employee.');
    if (employee.isOperational && employee.rosterEligibility && !employee.rosterEligibility.isRosterable) {
      await audit(auditContextFromReq(req), {
        action: 'ACCESS_DENIED', entityType: 'ShiftAssignment', entityId: employee.id,
        summary: `Blocked roster assignment for ${employee.fullName}: not rosterable (${employee.rosterEligibility.reasons.join('; ')})`,
      });
      throw BadRequest(`${employee.fullName} is not rosterable: ${employee.rosterEligibility.reasons.join('; ')}`);
    }

    const rec = await prisma.shiftAssignment.upsert({
      where: { employeeId_date: { employeeId: data.employeeId, date } },
      create: { employeeId: data.employeeId, shiftId: data.shiftId, date },
      update: { shiftId: data.shiftId },
    });
    await audit(auditContextFromReq(req), { action: 'UPDATE', entityType: 'ShiftAssignment', entityId: rec.id, summary: `Assigned ${employee.fullName} to a shift on ${date.toDateString()}` });
    res.json(rec);
  }),
);

router.delete(
  '/assign/:id',
  requireModule('schedules', 'manage'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.shiftAssignment.findUnique({ where: { id: req.params.id } });
    if (!existing) throw NotFound('Assignment not found');
    await prisma.shiftAssignment.delete({ where: { id: req.params.id } });
    await audit(auditContextFromReq(req), { action: 'DELETE', entityType: 'ShiftAssignment', entityId: existing.id, summary: `Removed a shift assignment` });
    res.status(204).end();
  }),
);

export default router;
