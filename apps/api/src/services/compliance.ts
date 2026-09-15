import { NotificationChannel, TrainingRecordState } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

/**
 * Roster eligibility — the core operational rule.
 *
 * An operational employee (chauffeur, driver, mechanic) is NOT rosterable when:
 *   - a mandatory training programme flagged `blocksRostering` has lapsed
 *     (record missing, expired, or overdue against its cycle), OR
 *   - a document type flagged `blocksRosterIfExpired` (driving licence, medical
 *     fitness, defensive driving) is expired or missing.
 *
 * When eligibility flips to not-rosterable, Operations is notified. This is real
 * enforced logic, not decoration: the flag is consumed by scheduling/rostering
 * and surfaced across the People, Training and Dashboard modules.
 */
export async function evaluateRosterEligibility(employeeId: string): Promise<{ isRosterable: boolean; reasons: string[] }> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      documents: { include: { documentType: true } },
      trainingRecords: { include: { programme: true } },
      status: true,
      rosterEligibility: true,
    },
  });

  if (!employee) return { isRosterable: false, reasons: ['Employee not found'] };

  // Non-operational staff are always "rosterable" (rule does not apply).
  if (!employee.isOperational) {
    await upsertEligibility(employeeId, true, []);
    return { isRosterable: true, reasons: [] };
  }

  const now = new Date();
  const reasons: string[] = [];

  // 1) Blocking documents (licence, medical fitness, defensive driving cert).
  const blockingDocTypes = await prisma.documentType.findMany({ where: { blocksRosterIfExpired: true, isActive: true } });
  for (const dt of blockingDocTypes) {
    const docs = employee.documents.filter((d) => d.documentTypeId === dt.id);
    if (docs.length === 0) {
      reasons.push(`${dt.name} missing`);
      continue;
    }
    const latest = docs.reduce((a, b) => ((a.expiryDate?.getTime() ?? 0) > (b.expiryDate?.getTime() ?? 0) ? a : b));
    if (latest.expiryDate && latest.expiryDate < now) {
      reasons.push(`${dt.name} expired ${latest.expiryDate.toLocaleDateString('en-GB')}`);
    }
  }

  // 2) Blocking mandatory training programmes.
  const blockingProgrammes = await prisma.trainingProgramme.findMany({ where: { blocksRostering: true, isActive: true } });
  for (const prog of blockingProgrammes) {
    // Only programmes that apply to this employee.
    const applies = prog.appliesTo === 'ALL' || prog.appliesTo === 'OPERATIONS';
    if (!applies) continue;
    const record = employee.trainingRecords.find((r) => r.programmeId === prog.id);
    if (!record || record.state === TrainingRecordState.NOT_STARTED) {
      reasons.push(`${prog.name} not completed`);
      continue;
    }
    if (record.expiresAt && record.expiresAt < now) {
      reasons.push(`${prog.name} lapsed ${record.expiresAt.toLocaleDateString('en-GB')}`);
    } else if (record.state === TrainingRecordState.EXPIRED || record.state === TrainingRecordState.OVERDUE) {
      reasons.push(`${prog.name} ${record.state.toLowerCase()}`);
    }
  }

  const isRosterable = reasons.length === 0;
  const wasRosterable = employee.rosterEligibility?.isRosterable ?? true;
  await upsertEligibility(employeeId, isRosterable, reasons);

  // Notify Operations when an employee becomes not-rosterable.
  if (!isRosterable && wasRosterable) {
    await notifyOperations(employee.fullName, employee.employeeCode, reasons);
  }

  return { isRosterable, reasons };
}

async function upsertEligibility(employeeId: string, isRosterable: boolean, reasons: string[]) {
  await prisma.rosterEligibility.upsert({
    where: { employeeId },
    create: { employeeId, isRosterable, reasons, lastEvaluatedAt: new Date() },
    update: { isRosterable, reasons, lastEvaluatedAt: new Date() },
  });
}

async function notifyOperations(name: string, code: string, reasons: string[]) {
  try {
    await prisma.notification.create({
      data: {
        channel: NotificationChannel.OPERATIONS,
        title: 'Employee not rosterable',
        body: `${name} (${code}) should not be rostered: ${reasons.join('; ')}. Keep off assignment until cleared.`,
        entityType: 'RosterEligibility',
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to notify Operations of roster ineligibility');
  }
}

/** Re-evaluate every operational employee (used by seed and scheduled jobs). */
export async function evaluateAllOperational(): Promise<number> {
  const ops = await prisma.employee.findMany({ where: { isOperational: true }, select: { id: true } });
  for (const e of ops) await evaluateRosterEligibility(e.id);
  return ops.length;
}
