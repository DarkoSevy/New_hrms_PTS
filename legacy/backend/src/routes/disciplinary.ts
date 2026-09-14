import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper to promisify database calls
const dbGet = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbRun = (sql: string, params: any[] = []): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Get all disciplinary cases
router.get('/cases', async (req: Request, res: Response) => {
    try {
        const cases = await dbAll(`
            SELECT 
                dc.*,
                e.name as employeeName,
                e.employeeId
            FROM disciplinary_cases dc
            JOIN employees e ON dc.employee_id = e.id
            ORDER BY dc.date DESC
        `);

        res.json(cases);
    } catch (error: any) {
        console.error('Error fetching cases:', error);
        res.status(500).json({ error: 'Failed to fetch cases', details: error.message });
    }
});

// Get single case
router.get('/cases/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const caseData = await dbGet(`
            SELECT 
                dc.*,
                e.name as employeeName,
                e.employeeId
            FROM disciplinary_cases dc
            JOIN employees e ON dc.employee_id = e.id
            WHERE dc.id = ?
        `, [id]);

        if (!caseData) {
            return res.status(404).json({ error: 'Case not found' });
        }

        res.json(caseData);
    } catch (error: any) {
        console.error('Error fetching case:', error);
        res.status(500).json({ error: 'Failed to fetch case', details: error.message });
    }
});

// Create new disciplinary case
router.post('/cases', async (req: Request, res: Response) => {
    try {
        const { employeeId, caseType, date, reason, actionTaken, status, reportedBy, notes } = req.body;
        const id = uuidv4();

        await dbRun(`
            INSERT INTO disciplinary_cases (
                id, employee_id, case_type, date, reason, action_taken, status, reported_by, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, employeeId, caseType, date, reason, actionTaken || '', status || 'Open', reportedBy, notes || '']);

        res.status(201).json({ id, message: 'Case created successfully' });
    } catch (error: any) {
        console.error('Error creating case:', error);
        res.status(500).json({ error: 'Failed to create case', details: error.message });
    }
});

// Update case status
router.put('/cases/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, actionTaken, notes } = req.body;

        await dbRun(`
            UPDATE disciplinary_cases 
            SET status = ?, action_taken = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [status, actionTaken, notes, id]);

        res.json({ message: 'Case updated successfully' });
    } catch (error: any) {
        console.error('Error updating case:', error);
        res.status(500).json({ error: 'Failed to update case', details: error.message });
    }
});

// Delete case
router.delete('/cases/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await dbRun('DELETE FROM disciplinary_cases WHERE id = ?', [id]);

        res.json({ message: 'Case deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting case:', error);
        res.status(500).json({ error: 'Failed to delete case', details: error.message });
    }
});

export default router;
