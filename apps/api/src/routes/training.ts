import { Router } from 'express';
import { z } from 'zod';
import { AppliesTo, Prisma, TrainingRecordState } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { isAggregateOnly } from '../rbac/matrix.js';
import { audit, auditContextFromReq } from '../lib/audit.js';
import { addMonths, fmtDate } from '../lib/dates.js';
import { evaluateRosterEligibility } from '../services/compliance.js';
import { BadRequest, NotFound } from '../lib/errors.js';

const router = Router();

function applicableWhere(appliesTo: AppliesTo): Prisma.EmployeeWhereInput {
  const base: Prisma.EmployeeWhereInput = { status: { countsAsActive: true } };
  if (appliesTo === 'OPERATIONS') return { ...base, isOperational: true };
  if (appliesTo === 'OFFICE') return { ...base, isOperational: false };
  if (appliesTo === 'MALE') return { ...base, gender: 'Male' };
  if (appliesTo === 'FEMALE') return { ...base, gender: 'Female' };
  return base;
}

// Main training overview (HR/manager/exec).
router.get(
  '/',
  requireModule('training', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    if (p.role === 'EMPLOYEE') return res.redirect(307, '/api/training/self');
    const now = new Date();
    const programmes = await prisma.trainingProgramme.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });

    const rows = await Promise.all(
      programmes.map(async (prog) => {
        const who = await prisma.employee.count({ where: applicableWhere(prog.appliesTo) });
        const done = await prisma.trainingRecord.count({ where: { programmeId: prog.id, state: TrainingRecordState.VALID, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] } });
        const overdue = await prisma.trainingRecord.count({ where: { programmeId: prog.id, OR: [{ state: { in: [TrainingRecordState.OVERDUE, TrainingRecordState.EXPIRED] } }, { expiresAt: { lt: now } }] } });
        return {
          id: prog.id, name: prog.name, category: prog.category, cycleMonths: prog.cycleMonths, provider: prog.provider,
          who, done, overdue, pct: who ? Math.round((done / who) * 100) : 0, blocksRostering: prog.blocksRostering,
        };
      }),
    );

    const [sessions, kpis] = await Promise.all([
      prisma.trainingSession.findMany({ where: { date: { gte: now } }, include: { programme: { select: { name: true } } }, orderBy: { date: 'asc' }, take: 8 }),
      (async () => {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const overdueCount = await prisma.trainingRecord.count({ where: { OR: [{ state: { in: [TrainingRecordState.OVERDUE, TrainingRecordState.EXPIRED] } }, { expiresAt: { lt: now } }] } });
        const totalMandatory = await prisma.trainingRecord.count({ where: { programme: { isMandatory: true } } });
        const validMandatory = await prisma.trainingRecord.count({ where: { programme: { isMandatory: true }, state: TrainingRecordState.VALID, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] } });
        const sessionsThisMonth = await prisma.trainingSession.count({ where: { date: { gte: monthStart, lt: monthEnd } } });
        return { current: totalMandatory ? Math.round((validMandatory / totalMandatory) * 100) : 0, overdue: overdueCount, sessions: sessionsThisMonth };
      })(),
    ]);

    // Blocked staff = operational, not rosterable due to a training reason.
    const blocked = isAggregateOnly(p.role)
      ? []
      : await prisma.rosterEligibility.findMany({
          where: { isRosterable: false, employee: { isOperational: true } },
          include: { employee: { select: { fullName: true, initials: true, position: { select: { title: true } }, department: { select: { name: true } } } } },
          take: 10,
        });

    res.json({
      eyebrow: isAggregateOnly(p.role) ? 'Aggregate compliance · no individual records' : 'Mandatory programmes and development · configurable in Admin',
      kpis,
      programmes: rows,
      sessions: sessions.map((s) => ({ id: s.id, date: s.date, name: s.programme.name, location: s.location, seats: s.capacity ? `${s.booked} of ${s.capacity} booked` : 'Open', })),
      blocked: blocked.map((b) => ({ name: b.employee.fullName, initials: b.employee.initials, role: `${b.employee.position.title} · ${b.employee.department.name}`, reasons: b.reasons })),
    });
  }),
);

// Self view — my certifications.
router.get(
  '/self',
  requireModule('training', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    if (!p.employeeId) throw BadRequest('No employee record linked to your account.');
    const now = new Date();
    const records = await prisma.trainingRecord.findMany({ where: { employeeId: p.employeeId }, include: { programme: true }, orderBy: { programme: { sortOrder: 'asc' } } });
    const eligibility = await prisma.rosterEligibility.findUnique({ where: { employeeId: p.employeeId } });
    res.json({
      records: records.map((r) => {
        const expired = r.expiresAt && r.expiresAt < now;
        const state = expired ? 'Overdue' : r.state === 'BOOKED' ? 'Booked' : r.state === 'VALID' ? 'Valid' : r.state === 'NOT_STARTED' ? 'Not started' : r.state.toLowerCase();
        return {
          id: r.id, name: r.programme.name, state,
          meta: r.completedAt ? `Completed ${fmtDate(r.completedAt)}${r.expiresAt ? ` · renews ${fmtDate(r.expiresAt)}` : ''}` : r.state === 'BOOKED' ? 'Booked — awaiting session' : 'Not yet completed',
          overdue: !!expired || r.state === 'OVERDUE' || r.state === 'EXPIRED',
        };
      }),
      rosterable: eligibility?.isRosterable ?? true,
      reasons: eligibility?.reasons ?? [],
    });
  }),
);

// Record a completion (updates state + expiry from cycle, re-evaluates rostering).
const recordSchema = z.object({
  employeeId: z.string(),
  programmeId: z.string(),
  completedAt: z.string(),
});
router.post(
  '/records',
  requireModule('training', 'manage'),
  asyncHandler(async (req, res) => {
    const data = recordSchema.parse(req.body);
    const prog = await prisma.trainingProgramme.findUnique({ where: { id: data.programmeId } });
    if (!prog) throw BadRequest('Unknown programme.');
    const completedAt = new Date(data.completedAt);
    const expiresAt = prog.cycleMonths ? addMonths(completedAt, prog.cycleMonths) : null;
    const rec = await prisma.trainingRecord.upsert({
      where: { employeeId_programmeId: { employeeId: data.employeeId, programmeId: data.programmeId } },
      create: { employeeId: data.employeeId, programmeId: data.programmeId, completedAt, expiresAt, state: TrainingRecordState.VALID },
      update: { completedAt, expiresAt, state: TrainingRecordState.VALID },
    });
    const elig = await evaluateRosterEligibility(data.employeeId);
    await audit(auditContextFromReq(req), { action: 'UPDATE', entityType: 'TrainingRecord', entityId: rec.id, summary: `Recorded completion of ${prog.name}`, newValue: { completedAt, expiresAt } });
    res.json({ record: rec, rosterEligibility: elig });
  }),
);

// Book a session for an employee.
const bookSchema = z.object({ employeeId: z.string(), sessionId: z.string() });
router.post(
  '/book',
  requireModule('training', 'manage'),
  asyncHandler(async (req, res) => {
    const data = bookSchema.parse(req.body);
    const session = await prisma.trainingSession.findUnique({ where: { id: data.sessionId }, include: { programme: true } });
    if (!session) throw NotFound('Session not found');
    const rec = await prisma.trainingRecord.upsert({
      where: { employeeId_programmeId: { employeeId: data.employeeId, programmeId: session.programmeId } },
      create: { employeeId: data.employeeId, programmeId: session.programmeId, state: TrainingRecordState.BOOKED, sessionId: session.id },
      update: { state: TrainingRecordState.BOOKED, sessionId: session.id },
    });
    await prisma.trainingSession.update({ where: { id: session.id }, data: { booked: { increment: 1 } } });
    await audit(auditContextFromReq(req), { action: 'UPDATE', entityType: 'TrainingRecord', entityId: rec.id, summary: `Booked ${session.programme.name} session` });
    res.json(rec);
  }),
);

export default router;
