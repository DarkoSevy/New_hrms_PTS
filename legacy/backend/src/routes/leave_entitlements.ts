import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper to promisify database operations
const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbGet = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
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

// Initialize leave entitlements for an employee (call this when employee is created)
router.post('/initialize', async (req: Request, res: Response) => {
    try {
        const { employeeId, year } = req.body;

        if (!employeeId) {
            return res.status(400).json({ error: 'Employee ID is required' });
        }

        const currentYear = year || new Date().getFullYear();

        // Check if entitlements already exist
        const existing = await dbAll(
            'SELECT * FROM leave_entitlements WHERE employee_id = ? AND year = ?',
            [employeeId, currentYear]
        );

        if (existing.length > 0) {
            return res.status(200).json({ message: 'Entitlements already exist', entitlements: existing });
        }

        // Create default entitlements for different leave types
        const leaveTypes = [
            { type: 'Annual Leave', days: 22 },
            { type: 'Sick Leave', days: 10 },
            { type: 'Maternity Leave', days: 90 },
            { type: 'Paternity Leave', days: 7 }
        ];

        for (const leave of leaveTypes) {
            await dbRun(
                `INSERT INTO leave_entitlements (id, employee_id, leave_type, annual_days, used_days, remaining_days, year)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), employeeId, leave.type, leave.days, 0, leave.days, currentYear]
            );
        }

        const entitlements = await dbAll(
            'SELECT * FROM leave_entitlements WHERE employee_id = ? AND year = ?',
            [employeeId, currentYear]
        );

        res.status(201).json({ message: 'Entitlements initialized successfully', entitlements });
    } catch (error: any) {
        console.error('Error initializing entitlements:', error);
        res.status(500).json({ error: 'Failed to initialize entitlements', details: error.message });
    }
});

// Get leave entitlements for an employee
router.get('/:employeeId', async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

        const entitlements = await dbAll(
            'SELECT * FROM leave_entitlements WHERE employee_id = ? AND year = ? ORDER BY leave_type',
            [employeeId, year]
        );

        if (entitlements.length === 0) {
            return res.status(404).json({ error: 'No entitlements found. Initialize entitlements first.' });
        }

        const totalRemaining = entitlements.reduce((sum, ent) => sum + ent.remaining_days, 0);

        res.json({ entitlements, totalRemaining });
    } catch (error: any) {
        console.error('Error fetching entitlements:', error);
        res.status(500).json({ error: 'Failed to fetch entitlements', details: error.message });
    }
});

// Get leave balance for a specific leave type
router.get('/balance/:employeeId', async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

        const entitlements = await dbAll(
            'SELECT * FROM leave_entitlements WHERE employee_id = ? AND year = ?',
            [employeeId, year]
        );

        if (entitlements.length === 0) {
            return res.status(404).json({ error: 'No entitlements found' });
        }

        const balance: any = {};
        entitlements.forEach((ent: any) => {
            balance[ent.leave_type] = {
                total: ent.annual_days,
                used: ent.used_days,
                remaining: ent.remaining_days
            };
        });

        res.json(balance);
    } catch (error: any) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ error: 'Failed to fetch balance', details: error.message });
    }
});

// Update leave entitlement (customize annual days)
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { annual_days } = req.body;

        if (!annual_days || annual_days < 0) {
            return res.status(400).json({ error: 'Valid annual_days is required' });
        }

        // Get current entitlement
        const entitlement: any = await dbGet('SELECT * FROM leave_entitlements WHERE id = ?', [id]);

        if (!entitlement) {
            return res.status(404).json({ error: 'Entitlement not found' });
        }

        // Calculate new remaining days
        const newRemaining = annual_days - entitlement.used_days;

        await dbRun(
            `UPDATE leave_entitlements 
             SET annual_days = ?, remaining_days = ?, updated_at = datetime('now')
             WHERE id = ?`,
            [annual_days, newRemaining, id]
        );

        const updated = await dbGet('SELECT * FROM leave_entitlements WHERE id = ?', [id]);
        res.json({ message: 'Entitlement updated successfully', entitlement: updated });
    } catch (error: any) {
        console.error('Error updating entitlement:', error);
        res.status(500).json({ error: 'Failed to update entitlement', details: error.message });
    }
});

// Deduct days from entitlement (called when leave is approved)
router.post('/deduct', async (req: Request, res: Response) => {
    try {
        const { employeeId, leaveType, days, year } = req.body;

        if (!employeeId || !leaveType || !days) {
            return res.status(400).json({ error: 'employeeId, leaveType, and days are required' });
        }

        const currentYear = year || new Date().getFullYear();

        let entitlement: any = await dbGet(
            'SELECT * FROM leave_entitlements WHERE employee_id = ? AND leave_type = ? AND year = ?',
            [employeeId, leaveType, currentYear]
        );

        // If entitlement doesn't exist, initialize it automatically
        if (!entitlement) {
            console.log(`No entitlements found for employee ${employeeId}, initializing...`);

            // Create default entitlements for all leave types
            const leaveTypes = [
                { type: 'Annual Leave', days: 22 },
                { type: 'Sick Leave', days: 10 },
                { type: 'Maternity Leave', days: 90 },
                { type: 'Paternity Leave', days: 7 }
            ];

            for (const leave of leaveTypes) {
                await dbRun(
                    `INSERT INTO leave_entitlements (id, employee_id, leave_type, annual_days, used_days, remaining_days, year)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), employeeId, leave.type, leave.days, 0, leave.days, currentYear]
                );
            }

            // Fetch the newly created entitlement
            entitlement = await dbGet(
                'SELECT * FROM leave_entitlements WHERE employee_id = ? AND leave_type = ? AND year = ?',
                [employeeId, leaveType, currentYear]
            );
        }

        const newUsed = entitlement.used_days + days;
        const newRemaining = entitlement.annual_days - newUsed;

        await dbRun(
            `UPDATE leave_entitlements 
             SET used_days = ?, remaining_days = ?, updated_at = datetime('now')
             WHERE id = ?`,
            [newUsed, newRemaining, entitlement.id]
        );

        const updated = await dbGet('SELECT * FROM leave_entitlements WHERE id = ?', [entitlement.id]);
        res.json({ message: 'Leave days deducted successfully', entitlement: updated });
    } catch (error: any) {
        console.error('Error deducting leave days:', error);
        res.status(500).json({ error: 'Failed to deduct leave days', details: error.message });
    }
});

export default router;
