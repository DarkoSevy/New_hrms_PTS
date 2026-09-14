import { AuditAction, Prisma, Role } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from './prisma.js';
import { logger } from './logger.js';

export interface AuditContext {
  actorUserId?: string | null;
  actorName: string;
  actorRole?: Role | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuditEntry {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  summary: string;
  previousValue?: unknown;
  newValue?: unknown;
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Write an append-only audit row. Sensitive reads and every write pass through
 * here. Failures are logged but never block the primary operation from
 * returning — except the write itself is best-effort durable.
 */
export async function audit(ctx: AuditContext, entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: ctx.actorUserId ?? null,
        actorName: ctx.actorName,
        actorRole: ctx.actorRole ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        summary: entry.summary,
        previousValue: toJson(entry.previousValue),
        newValue: toJson(entry.newValue),
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });
  } catch (err) {
    logger.error({ err, entry }, 'Failed to write audit log');
  }
}

/** Build an AuditContext from an authenticated request. */
export function auditContextFromReq(req: Request): AuditContext {
  const p = req.principal;
  return {
    actorUserId: p?.userId ?? null,
    actorName: p?.fullName ?? 'anonymous',
    actorRole: p?.role ?? null,
    ip: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  };
}

/** Reduce an object to a plain, loggable snapshot (drops undefined). */
export function snapshot<T extends Record<string, unknown>>(
  obj: T | null | undefined,
  fields?: (keyof T)[],
): Record<string, unknown> | null {
  if (!obj) return null;
  const keys = fields ?? (Object.keys(obj) as (keyof T)[]);
  const out: Record<string, unknown> = {};
  for (const k of keys) out[String(k)] = obj[k];
  return out;
}
