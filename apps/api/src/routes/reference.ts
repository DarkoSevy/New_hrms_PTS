import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { visibleModules, canViewCompensation } from '../rbac/matrix.js';

const router = Router();

/**
 * Aggregate reference data for form dropdowns and filters. Read-only; available
 * to any authenticated user. Reference collections are all admin-configurable
 * (managed under /api/settings).
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [
      departments,
      positions,
      employmentTypes,
      employeeStatuses,
      leaveTypes,
      documentTypes,
      trainingProgrammes,
      requestTypes,
      medicalSchemes,
      shifts,
    ] = await Promise.all([
      prisma.department.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.position.findMany({ where: { isActive: true }, orderBy: { title: 'asc' }, include: { department: { select: { name: true } } } }),
      prisma.employmentType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.employeeStatus.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.leaveType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.documentType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.trainingProgramme.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.requestType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.medicalScheme.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.shift.findMany({ where: { isActive: true }, orderBy: { startTime: 'asc' } }),
    ]);

    res.json({
      departments,
      positions,
      employmentTypes,
      employeeStatuses,
      leaveTypes,
      documentTypes,
      trainingProgrammes,
      requestTypes,
      medicalSchemes,
      shifts,
    });
  }),
);

/** Current principal's navigation + capability envelope. */
router.get(
  '/meta',
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    res.json({
      role: p.role,
      modules: visibleModules(p.role),
      canViewCompensation: canViewCompensation(p.role),
      settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    });
  }),
);

export default router;
