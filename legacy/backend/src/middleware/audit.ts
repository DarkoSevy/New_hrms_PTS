import { Request, Response, NextFunction } from 'express';
import { db } from '../database';

export const auditMiddleware = (action: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Store original send function
        const originalSend = res.send;

        // Override send function to log after response
        res.send = function (data: any) {
            // Log the action
            try {
                const user = (req as any).user;
                const userId = user ? user.id : 'anonymous';
                const entityType = req.baseUrl.split('/').pop() || 'unknown';
                const entityId = req.params.id || '';
                const changes = JSON.stringify({
                    method: req.method,
                    body: req.body,
                    params: req.params,
                    query: req.query
                });

                db.run(`
                    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, ip_address)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [userId, action, entityType, entityId, changes, req.ip], (err) => {
                    if (err) console.error('Audit logging DB error:', err);
                });
            } catch (error) {
                console.error('Audit logging error:', error);
            }

            // Call original send
            return originalSend.call(this, data);
        };

        next();
    };
};
