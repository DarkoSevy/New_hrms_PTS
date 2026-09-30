import type { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { can, canViewCompensation, type Capability, type ModuleKey } from '../rbac/matrix.js';
import { Forbidden, Unauthorized } from '../lib/errors.js';
import { audit, auditContextFromReq } from '../lib/audit.js';

/**
 * Gate a route on module + capability from the RBAC matrix. A denied attempt is
 * recorded in the audit trail (ACCESS_DENIED) before the 403 is returned.
 */
export function requireModule(module: ModuleKey, capability: Capability = 'view') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const p = req.principal;
    if (!p) return next(Unauthorized());
    if (!can(p.role, module, capability)) {
      void audit(auditContextFromReq(req), {
        action: 'ACCESS_DENIED',
        entityType: module,
        summary: `${p.fullName} (${p.role}) was denied ${capability} on ${module}`,
      });
      return next(Forbidden(`Your role cannot ${capability} the ${module} module.`));
    }
    return next();
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const p = req.principal;
    if (!p) return next(Unauthorized());
    if (!roles.includes(p.role)) {
      return next(Forbidden());
    }
    return next();
  };
}

export function requireCompensationAccess(req: Request, _res: Response, next: NextFunction) {
  const p = req.principal;
  if (!p) return next(Unauthorized());
  if (!canViewCompensation(p.role)) {
    void audit(auditContextFromReq(req), {
      action: 'ACCESS_DENIED',
      entityType: 'Compensation',
      summary: `${p.fullName} (${p.role}) was denied access to compensation data`,
    });
    return next(Forbidden('Compensation data is restricted to the HR Administrator.'));
  }
  return next();
}
