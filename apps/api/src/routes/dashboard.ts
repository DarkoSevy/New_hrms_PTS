import { Router } from 'express';
import { LeaveStage, AttendanceStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { ownedRecordScope } from '../rbac/scope.js';
import { startOfToday, addDays } from '../lib/dates.js';

const router = Router();

router.get(
  '/',
  requireModule('dashboard', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const today = startOfToday();
    const in60 = addDays(today, 60);
    // The leave queue is individual data — scope it to what this role may see.
    const leaveScope = ownedRecordScope(p) as Prisma.LeaveRequestWhereInput;

    const [
      activeCount,
      driversOnDuty,
      openPositions,
      leaveAwaiting,
      onLeaveToday,
      overdueTraining,
      openRequests,
      contractsExpiring,
      probationDue,
      deptCounts,
      attendanceToday,
    ] = await Promise.all([
      prisma.employee.count({ where: { status: { countsAsActive: true } } }),
      prisma.attendance.count({ where: { date: today, status: AttendanceStatus.ON_DUTY, employee: { isOperational: true } } }),
      prisma.vacancy.aggregate({ _sum: { numberOfPositions: true }, where: { stage: { notIn: ['FILLED', 'CLOSED'] } } }),
      prisma.leaveRequest.count({ where: { stage: { in: [LeaveStage.SUPERVISOR, LeaveStage.HR_VALIDATION] } } }),
      prisma.leaveRequest.count({ where: { stage: LeaveStage.APPROVED, startDate: { lte: today }, endDate: { gte: today } } }),
      prisma.trainingRecord.count({ where: { state: { in: ['OVERDUE', 'EXPIRED'] } } }),
      prisma.hrRequest.count({ where: { status: { in: ['IN_PROGRESS', 'PENDING_MANAGER', 'AWAITING_EMPLOYEE', 'OVERDUE'] } } }),
      prisma.contract.count({ where: { isActive: true, endDate: { gte: today, lte: in60 } } }),
      prisma.contract.count({ where: { isActive: true, probationEndDate: { gte: today, lte: in60 } } }),
      prisma.employee.groupBy({ by: ['departmentId'], where: { status: { countsAsActive: true } }, _count: true }),
      prisma.attendance.groupBy({ by: ['status'], where: { date: today }, _count: true }),
    ]);

    const departments = await prisma.department.findMany({ select: { id: true, name: true } });
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));
    const headcountByDept = deptCounts
      .map((d) => ({ name: deptMap.get(d.departmentId) ?? 'Unknown', count: d._count }))
      .sort((a, b) => b.count - a.count);

    // Compliance watchlist for operational staff.
    const [opsTotal, notRosterable] = await Promise.all([
      prisma.employee.count({ where: { isOperational: true, status: { countsAsActive: true } } }),
      prisma.rosterEligibility.count({ where: { isRosterable: false, employee: { isOperational: true } } }),
    ]);

    // Leave queue preview (awaiting decision) — scoped to the viewer's records.
    const queue = await prisma.leaveRequest.findMany({
      where: { AND: [leaveScope, { stage: { in: [LeaveStage.SUPERVISOR, LeaveStage.HR_VALIDATION] } }] },
      take: 6,
      orderBy: { filedAt: 'asc' },
      include: { employee: { select: { fullName: true, position: { select: { title: true } }, department: { select: { name: true } } } }, leaveType: { select: { name: true } } },
    });

    // Contracts / probation expiring preview.
    const expiring = await prisma.contract.findMany({
      where: { isActive: true, OR: [{ endDate: { gte: today, lte: in60 } }, { probationEndDate: { gte: today, lte: in60 } }] },
      take: 6,
      include: { employee: { select: { fullName: true, initials: true } } },
      orderBy: { endDate: 'asc' },
    });

    const attendanceCounts = Object.fromEntries(attendanceToday.map((a) => [a.status, a._count]));
    const attendanceTotal = attendanceToday.reduce((s, a) => s + a._count, 0);

    res.json({
      headline: [
        { value: activeCount, label: 'Active employees' },
        { value: driversOnDuty, label: 'Drivers on duty' },
        { value: openPositions._sum.numberOfPositions ?? 0, label: 'Open positions' },
      ],
      actionPills: [
        { count: leaveAwaiting, label: 'leave approvals', key: 'leave' },
        { count: contractsExpiring, label: 'contracts expiring', key: 'contracts' },
        { count: probationDue, label: 'probation reviews', key: 'contracts' },
        { count: overdueTraining, label: 'overdue training', key: 'training' },
        { count: openRequests, label: 'HR requests', key: 'requests' },
      ],
      attendance: {
        total: attendanceTotal,
        onDuty: attendanceCounts[AttendanceStatus.ON_DUTY] ?? 0,
        onLeave: attendanceCounts[AttendanceStatus.ON_LEAVE] ?? 0,
        unexplained: attendanceCounts[AttendanceStatus.UNEXPLAINED] ?? 0,
        pct: attendanceTotal ? Math.round(((attendanceCounts[AttendanceStatus.ON_DUTY] ?? 0) / attendanceTotal) * 100) : 0,
      },
      leaveQueue: queue.map((l) => ({
        id: l.id,
        reference: l.reference,
        name: l.employee.fullName,
        role: `${l.employee.position.title} · ${l.employee.department.name}`,
        type: l.leaveType.name,
        days: l.days,
        dates: fmtRange(l.startDate, l.endDate),
        stage: l.stage,
      })),
      watchlist: [
        { label: 'Operational staff rosterable', value: opsTotal - notRosterable, of: opsTotal },
      ],
      headcountByDept,
      onLeaveToday,
      expiring: expiring.map((c) => ({
        id: c.id,
        name: c.employee.fullName,
        initials: c.employee.initials,
        kind: c.probationEndDate && c.probationEndDate <= in60 ? 'Probation end' : `${labelKind(c.kind)} contract`,
        due: c.probationEndDate && c.probationEndDate <= in60 ? c.probationEndDate : c.endDate,
      })),
    });
  }),
);

function fmtRange(a: Date, b: Date): string {
  const d = (x: Date) => x.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  return `${d(a)} – ${d(b)}`;
}
function labelKind(kind: string): string {
  return kind.replace('_', '-').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default router;
