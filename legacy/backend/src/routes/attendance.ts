import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get attendance records (optional filter by date or employee)
router.get('/', (req: Request, res: Response) => {
    const { date, employeeId, startDate, endDate } = req.query;

    let query = `
        SELECT a.*, e.name as employeeName, e.department 
        FROM attendance_records a
        LEFT JOIN employees e ON a.employee_id = e.id
        WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
        query += ` AND a.date = ?`;
        params.push(date);
    }

    if (employeeId) {
        query += ` AND a.employee_id = ?`;
        params.push(employeeId);
    }

    if (startDate && endDate) {
        query += ` AND a.date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }

    query += ` ORDER BY a.date DESC, e.name ASC`;

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching attendance:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Log attendance (Create or Update)
// We use an upsert-like logic: check if record exists for this employee and date.
router.post('/', (req: Request, res: Response) => {
    const { employeeId, date, status, clockIn, clockOut, notes, overtime } = req.body;

    if (!employeeId || !date || !status) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    // Check if record exists
    db.get(
        'SELECT id FROM attendance_records WHERE employee_id = ? AND date = ?',
        [employeeId, date],
        (err, row: any) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (row) {
                // Update existing
                db.run(
                    `UPDATE attendance_records 
                     SET status = ?, clock_in = ?, clock_out = ?, overtime_hours = ?, notes = ?
                     WHERE id = ?`,
                    [status, clockIn, clockOut, overtime || 0, notes, row.id],
                    function (err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.json({ message: 'Attendance updated', id: row.id });
                    }
                );
            } else {
                // Create new
                const id = uuidv4();
                db.run(
                    `INSERT INTO attendance_records (id, employee_id, date, status, clock_in, clock_out, overtime_hours, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, employeeId, date, status, clockIn, clockOut, overtime || 0, notes],
                    function (err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.status(201).json({ message: 'Attendance logged', id });
                    }
                );
            }
        }
    );
});

// Delete attendance record
router.delete('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.run('DELETE FROM attendance_records WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Attendance record deleted' });
    });
});

// Bulk Import (optional, good for migration)
// Not implemented yet

export default router;
