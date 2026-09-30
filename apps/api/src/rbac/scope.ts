import { Prisma, Role } from '@prisma/client';

export interface Principal {
  userId: string;
  role: Role;
  employeeId: string | null;
  fullName: string;
}

/**
 * Build the Prisma `where` fragment that limits which Employee rows a principal
 * may see. This is applied on the SERVER for every employee-scoped query — the
 * client never decides what it can read.
 *
 *  HR Administrator / HR Officer : all employees
 *  Manager                       : own direct reports + self (reporting line)
 *  Employee                      : self only
 *  Senior Management             : none (aggregate endpoints only)
 */
export function employeeScope(p: Principal): Prisma.EmployeeWhereInput {
  switch (p.role) {
    case Role.HR_ADMINISTRATOR:
    case Role.HR_OFFICER:
      return {};
    case Role.MANAGER:
      if (!p.employeeId) return { id: '__none__' };
      return {
        OR: [{ id: p.employeeId }, { directManagerId: p.employeeId }],
      };
    case Role.EMPLOYEE:
      return { id: p.employeeId ?? '__none__' };
    case Role.SENIOR_MANAGEMENT:
      // No individual records — aggregate views only.
      return { id: '__none__' };
    default:
      return { id: '__none__' };
  }
}

/** Can this principal read the full individual record of the given employee? */
export function canReadEmployee(p: Principal, target: { id: string; directManagerId: string | null }): boolean {
  switch (p.role) {
    case Role.HR_ADMINISTRATOR:
    case Role.HR_OFFICER:
      return true;
    case Role.MANAGER:
      return target.id === p.employeeId || target.directManagerId === p.employeeId;
    case Role.EMPLOYEE:
      return target.id === p.employeeId;
    case Role.SENIOR_MANAGEMENT:
      return false;
    default:
      return false;
  }
}

/** Scope applied to any model that has an `employeeId` column. */
export function ownedRecordScope(p: Principal, employeeField = 'employeeId'): Record<string, unknown> {
  switch (p.role) {
    case Role.HR_ADMINISTRATOR:
    case Role.HR_OFFICER:
      return {};
    case Role.MANAGER:
      return {
        employee: { OR: [{ id: p.employeeId }, { directManagerId: p.employeeId }] },
      };
    case Role.EMPLOYEE:
      return { [employeeField]: p.employeeId ?? '__none__' };
    case Role.SENIOR_MANAGEMENT:
      return { [employeeField]: '__none__' };
    default:
      return { [employeeField]: '__none__' };
  }
}
