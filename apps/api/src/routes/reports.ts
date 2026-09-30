import { Router } from 'express';
import { LeaveStage } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { canViewCompensation } from '../rbac/matrix.js';

const router = Router();

// Reports landing summary + the catalogue of exports this role may run.
router.get(
  '/',
  requireModule('reports', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const [headcount, onLeave, contractsExpiring, overdueTraining, openRequests] = await Promise.all([
      prisma.employee.count({ where: { status: { countsAsActive: true } } }),
      prisma.leaveRequest.count({ where: { stage: LeaveStage.APPROVED, startDate: { lte: new Date() }, endDate: { gte: new Date() } } }),
      prisma.contract.count({ where: { isActive: true, endDate: { gte: new Date(), lte: new Date(Date.now() + 60 * 86400000) } } }),
      prisma.trainingRecord.count({ where: { OR: [{ state: { in: ['OVERDUE', 'EXPIRED'] } }, { expiresAt: { lt: new Date() } }] } }),
      prisma.hrRequest.count({ where: { status: { notIn: ['RESOLVED', 'CANCELLED'] } } }),
    ]);

    const reports = [
      { key: 'employees', name: 'Employee directory', description: 'Full master list with department, position, status and rosterability', module: 'people' },
      { key: 'contracts', name: 'Contract register', description: 'Contracts and probation with expiry status', module: 'contracts' },
      { key: 'leave', name: 'Leave requests', description: 'Leave requests by stage and department', module: 'leave' },
      { key: 'attendance', name: 'Attendance', description: 'Daily attendance by status', module: 'attendance' },
      { key: 'requests', name: 'HR requests', description: 'Requests with SLA status', module: 'requests' },
      { key: 'audit', name: 'Audit trail', description: 'Every sensitive read and write (HR Administrator)', module: 'audit' },
      { key: 'payroll', name: 'Payroll inputs', description: 'Approved payroll inputs (HR Administrator)', module: 'payroll' },
    ].filter((r) => {
      if (r.key === 'payroll' || r.key === 'audit') return canViewCompensation(p.role) || p.role === 'HR_ADMINISTRATOR';
      return true;
    });

    res.json({
      summary: { headcount, onLeave, contractsExpiring, overdueTraining, openRequests },
      reports,
    });
  }),
);

export default router;
