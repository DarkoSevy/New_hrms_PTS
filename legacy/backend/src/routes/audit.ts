import express, { Request, Response } from 'express';
import { db } from '../database';
import { logAction } from '../middleware/auditLogger';

const router = express.Router();

// Helper: promisify db.all
const dbAll = (sql: string, params: any[] = []): Promise<any[]> =>
    new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows as any[]);
        });
    });

// Helper: promisify db.get
const dbGet = (sql: string, params: any[] = []): Promise<any> =>
    new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

/**
 * GET /api/audit
 * Full-featured paginated + filterable audit log listing.
 * Query params: action, entity_type, user_id, search, from, to, severity, limit, offset
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            action,
            entity_type,
            user_id,
            search,
            from,
            to,
            severity,
            limit = '50',
            offset = '0',
        } = req.query as Record<string, string>;

        const conditions: string[] = [];
        const params: any[] = [];

        if (action) {
            conditions.push('action = ?');
            params.push(action);
        }
        if (entity_type) {
            conditions.push('entity_type = ?');
            params.push(entity_type);
        }
        if (user_id) {
            conditions.push('user_id = ?');
            params.push(user_id);
        }
        if (severity) {
            conditions.push('severity = ?');
            params.push(severity);
        }
        if (search) {
            conditions.push('(username LIKE ? OR entity_type LIKE ? OR description LIKE ? OR action LIKE ?)');
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }
        if (from) {
            conditions.push('timestamp >= ?');
            params.push(from);
        }
        if (to) {
            conditions.push('timestamp <= ?');
            params.push(`${to} 23:59:59`);
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const parsedLimit = Math.min(parseInt(limit) || 50, 200);
        const parsedOffset = parseInt(offset) || 0;

        const [logs, countRow] = await Promise.all([
            dbAll(
                `SELECT * FROM audit_logs ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
                [...params, parsedLimit, parsedOffset]
            ),
            dbGet(`SELECT COUNT(*) as total FROM audit_logs ${where}`, params),
        ]);

        res.json({
            logs,
            total: countRow?.total || 0,
            limit: parsedLimit,
            offset: parsedOffset,
        });
    } catch (error: any) {
        console.error('[Audit GET] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/audit/stats
 * Returns counts grouped by action type for the last 30 days,
 * plus top users and total counts.
 */
router.get('/stats', async (_req: Request, res: Response) => {
    try {
        const [actionCounts, severityCounts, topUsers, recentTotal] = await Promise.all([
            dbAll(
                `SELECT action, COUNT(*) as count FROM audit_logs
                 WHERE timestamp >= datetime('now', '-30 days')
                 GROUP BY action ORDER BY count DESC`
            ),
            dbAll(
                `SELECT severity, COUNT(*) as count FROM audit_logs
                 WHERE timestamp >= datetime('now', '-30 days')
                 GROUP BY severity`
            ),
            dbAll(
                `SELECT username, COUNT(*) as count FROM audit_logs
                 WHERE timestamp >= datetime('now', '-30 days')
                 GROUP BY username ORDER BY count DESC LIMIT 5`
            ),
            dbGet(
                `SELECT COUNT(*) as total, 
                 SUM(CASE WHEN severity='critical' THEN 1 ELSE 0 END) as critical,
                 SUM(CASE WHEN severity='warning' THEN 1 ELSE 0 END) as warning,
                 COUNT(DISTINCT user_id) as unique_users
                 FROM audit_logs WHERE timestamp >= datetime('now', '-30 days')`
            ),
        ]);

        res.json({
            actionCounts,
            severityCounts,
            topUsers,
            summary: recentTotal,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/audit/entity/:entityType/:entityId
 * Get all logs for a specific entity (e.g., employee, leave request).
 */
router.get('/entity/:entityType/:entityId', async (req: Request, res: Response) => {
    try {
        const { entityType, entityId } = req.params;
        const logs = await dbAll(
            `SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY timestamp DESC`,
            [entityType.toUpperCase(), entityId]
        );
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/audit/user/:userId
 * Get all logs for a specific user.
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const logs = await dbAll(
            `SELECT * FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100`,
            [req.params.userId]
        );
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/audit/log
 * Internal endpoint for explicit audit logging from other routes.
 */
router.post('/log', (req: Request, res: Response) => {
    try {
        const { user_id, username, action, entity_type, entity_id, changes, severity, description } = req.body;

        if (!user_id || !action || !entity_type) {
            res.status(400).json({ error: 'user_id, action, and entity_type are required' });
            return;
        }

        logAction({
            user_id,
            username: username || 'system',
            action,
            entity_type,
            entity_id,
            changes,
            severity: severity || 'info',
            description,
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
