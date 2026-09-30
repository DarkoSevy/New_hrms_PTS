import { Role } from '@prisma/client';

/**
 * Application modules. These map to the navigation tabs in the design plus the
 * cross-cutting admin surfaces (settings, audit, reports).
 */
export type ModuleKey =
  | 'dashboard'
  | 'people'
  | 'leave'
  | 'contracts'
  | 'hiring'
  | 'training'
  | 'requests'
  | 'payroll'
  | 'attendance'
  | 'schedules'
  | 'reports'
  | 'admin'
  | 'audit';

export type Capability = 'view' | 'manage';

/**
 * The RBAC permission matrix — the single source of truth for which role may
 * VIEW and which may MANAGE (write) each module.
 *
 * The `view` sets reproduce the design's role→module map:
 *   HR Administrator : all 8 nav modules
 *   HR Officer       : all except payroll
 *   Manager          : dashboard, people, leave, training, requests
 *   Employee         : dashboard, leave, training, requests
 *   Senior Management: dashboard, leave, contracts, hiring, training (aggregate)
 *
 * Cross-cutting modules (attendance, schedules, reports, admin, audit) are
 * added on top with the appropriate role gates.
 */
const ALL: Role[] = [
  Role.HR_ADMINISTRATOR,
  Role.HR_OFFICER,
  Role.MANAGER,
  Role.EMPLOYEE,
  Role.SENIOR_MANAGEMENT,
];

export const MATRIX: Record<ModuleKey, Record<Capability, Role[]>> = {
  dashboard: { view: ALL, manage: [] },
  people: {
    view: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER],
    manage: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER],
  },
  leave: {
    view: ALL,
    manage: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER, Role.EMPLOYEE],
  },
  contracts: {
    view: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER, Role.SENIOR_MANAGEMENT],
    manage: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER],
  },
  hiring: {
    view: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER, Role.SENIOR_MANAGEMENT],
    manage: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER],
  },
  training: {
    view: ALL,
    manage: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER],
  },
  requests: {
    view: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER, Role.EMPLOYEE],
    manage: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER, Role.EMPLOYEE],
  },
  // Payroll inputs & compensation are restricted to the HR Administrator.
  // (The Finance boundary is an open question — see ASSUMPTIONS.md. Grant Finance
  // here once that role/scope is confirmed.)
  payroll: {
    view: [Role.HR_ADMINISTRATOR],
    manage: [Role.HR_ADMINISTRATOR],
  },
  attendance: {
    view: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER],
    manage: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER],
  },
  schedules: {
    view: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER],
    manage: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER, Role.MANAGER],
  },
  reports: {
    view: [Role.HR_ADMINISTRATOR, Role.HR_OFFICER, Role.SENIOR_MANAGEMENT, Role.MANAGER],
    manage: [Role.HR_ADMINISTRATOR],
  },
  admin: {
    view: [Role.HR_ADMINISTRATOR],
    manage: [Role.HR_ADMINISTRATOR],
  },
  audit: {
    view: [Role.HR_ADMINISTRATOR],
    manage: [],
  },
};

export function can(role: Role, module: ModuleKey, capability: Capability): boolean {
  return MATRIX[module][capability].includes(role);
}

/** Modules this role may see in navigation. */
export function visibleModules(role: Role): ModuleKey[] {
  return (Object.keys(MATRIX) as ModuleKey[]).filter((m) => can(role, m, 'view'));
}

/** Only the HR Administrator may read salary/compensation figures. */
export function canViewCompensation(role: Role): boolean {
  return role === Role.HR_ADMINISTRATOR;
}

/** Senior Management sees aggregates only — never individual records. */
export function isAggregateOnly(role: Role): boolean {
  return role === Role.SENIOR_MANAGEMENT;
}
