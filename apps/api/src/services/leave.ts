import { LeaveStage } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

/** Generate the next leave reference, LV-<year>-<zero-padded sequence>. */
export async function nextLeaveReference(year: number): Promise<string> {
  const prefix = `LV-${year}-`;
  const last = await prisma.leaveRequest.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });
  const seq = last ? Number(last.reference.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/** Inclusive whole-day count between two dates. */
export function leaveDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

export async function ensureBalance(employeeId: string, leaveTypeId: string, year: number, entitlement: number) {
  return prisma.leaveBalance.upsert({
    where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
    create: { employeeId, leaveTypeId, year, entitlement },
    update: {},
  });
}

/** Adjust pending/taken counters as a request moves through the workflow. */
export async function applyBalanceTransition(params: {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  days: number;
  from: LeaveStage | null;
  to: LeaveStage;
  entitlement: number;
}) {
  const { employeeId, leaveTypeId, year, days, from, to, entitlement } = params;
  const bal = await ensureBalance(employeeId, leaveTypeId, year, entitlement);
  let pending = bal.pending;
  let taken = bal.taken;

  const wasPending = from === null || from === LeaveStage.SUPERVISOR || from === LeaveStage.HR_VALIDATION || from === LeaveStage.EMPLOYEE_REQUEST;

  if (to === LeaveStage.SUPERVISOR && from === null) {
    pending += days; // newly filed
  } else if (to === LeaveStage.APPROVED) {
    if (wasPending) pending = Math.max(0, pending - days);
    taken += days;
  } else if (to === LeaveStage.REJECTED || to === LeaveStage.CANCELLED) {
    if (wasPending) pending = Math.max(0, pending - days);
  }

  await prisma.leaveBalance.update({ where: { id: bal.id }, data: { pending, taken } });
}

/** Driver cover check for a date range against the configured cover floor. */
export async function coverCheck(): Promise<{ floor: number; days: { day: string; away: number; need: string }[] }> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'driver_cover_floor' } });
  const floor = Number(setting?.value ?? 55);
  const totalDrivers = await prisma.employee.count({ where: { isOperational: true, status: { countsAsActive: true } } });

  // Count operational staff on approved leave for each of the next 5 days.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { day: string; away: number; need: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const away = await prisma.leaveRequest.count({
      where: {
        stage: LeaveStage.APPROVED,
        startDate: { lte: d },
        endDate: { gte: d },
        employee: { isOperational: true },
      },
    });
    const onDuty = totalDrivers - away;
    const need = onDuty < floor ? 'Below cover' : onDuty < floor + 3 ? 'Tight' : 'OK';
    days.push({ day: d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' }), away, need });
  }
  return { floor, days };
}
