import { Request, Response, NextFunction } from 'express';
import { db } from '../database';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'VIEW' | 'APPROVE' | 'REJECT';

export interface AuditLogEntry {
    user_id: string;
    username: string;
    action: AuditAction;
    entity_type: string;
    entity_id?: string;
    changes?: object | string;
    ip_address?: string;
    severity?: 'info' | 'warning' | 'critical';
    description?: string;
}

/**
 * Standalone helper used anywhere in the codebase to write an audit log entry.
 */
export const logAction = (entry: AuditLogEntry): void => {
    const changesStr = entry.changes ? JSON.stringify(entry.changes) : null;
    const severity = entry.severity || 'info';
    db.run(
        `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, changes, ip_address, severity, description, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
            entry.user_id,
            entry.username,
            entry.action,
            entry.entity_type,
            entry.entity_id || null,
            changesStr,
            entry.ip_address || null,
            severity,
            entry.description || null,
        ],
        (err) => {
            if (err) console.error('[Audit] Failed to write log:', err.message);
        }
    );
};

/**
 * Middleware that automatically logs mutating HTTP actions (POST/PUT/PATCH/DELETE)
 * on successful responses (2xx).
 */
export const auditLogger = (req: Request, res: Response, next: NextFunction): void => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        next();
        return;
    }

    const originalSend = res.json.bind(res);

    res.json = (body: any) => {
        const status = res.statusCode;
        if (status >= 200 && status < 300 && req.user) {
            const pathParts = req.path.split('/').filter(Boolean);
            const entityType = pathParts[0]?.toUpperCase() || 'UNKNOWN';
            const entityId = pathParts[1] || undefined;

            const actionMap: Record<string, AuditAction> = {
                POST: 'CREATE',
                PUT: 'UPDATE',
                PATCH: 'UPDATE',
                DELETE: 'DELETE',
            };

            logAction({
                user_id: req.user.userId,
                username: req.user.email,
                action: actionMap[req.method] || 'CREATE',
                entity_type: entityType,
                entity_id: entityId,
                ip_address: req.ip || req.socket?.remoteAddress,
                severity: req.method === 'DELETE' ? 'warning' : 'info',
                description: `${req.method} ${req.path}`,
            });
        }
        return originalSend(body);
    };

    next();
};
