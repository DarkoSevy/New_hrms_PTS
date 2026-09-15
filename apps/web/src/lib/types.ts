export type Role =
  | 'HR_ADMINISTRATOR'
  | 'HR_OFFICER'
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'SENIOR_MANAGEMENT';

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

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  initials: string;
  employeeId: string | null;
  modules: ModuleKey[];
  canViewCompensation: boolean;
  employee?: {
    id: string;
    employeeCode: string;
    department: string;
    position: string;
    status: string;
    isOperational: boolean;
  } | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paged<T> {
  data: T[];
  pagination: Pagination;
}

export const ROLE_LABELS: Record<Role, string> = {
  HR_ADMINISTRATOR: 'HR Administrator',
  HR_OFFICER: 'HR Officer',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
  SENIOR_MANAGEMENT: 'Senior Management',
};

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  people: 'People',
  leave: 'Leave',
  contracts: 'Contracts',
  hiring: 'Hiring',
  training: 'Training',
  requests: 'Requests',
  payroll: 'Payroll',
  attendance: 'Attendance',
  schedules: 'Schedules',
  reports: 'Reports',
  admin: 'Admin',
  audit: 'Audit',
};

/** The primary navigation order that mirrors the design's top tabs. */
export const NAV_ORDER: ModuleKey[] = [
  'dashboard',
  'people',
  'leave',
  'contracts',
  'hiring',
  'training',
  'requests',
  'payroll',
  'attendance',
  'schedules',
  'reports',
  'admin',
  'audit',
];
