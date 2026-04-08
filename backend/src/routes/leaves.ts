import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all leave requests
router.get('/', (req: Request, res: Response) => {
    db.all(`
    SELECT lr.*, e.name as employeeName, e.avatarUrl as employeeAvatar 
    FROM leave_requests lr
    JOIN employees e ON lr.employeeId = e.id
  `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create leave request
router.post('/', (req: Request, res: Response) => {
    const { employeeId, leaveType, startDate, endDate, reason, status, documentName, documentContent } = req.body;
    const id = uuidv4();

    db.run(
        `INSERT INTO leave_requests (id, employeeId, leaveType, startDate, endDate, reason, status, documentName, documentContent) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, employeeId, leaveType, startDate, endDate, reason, status || 'Pending', documentName, documentContent],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id, employeeId, leaveType, startDate, endDate, reason, status: status || 'Pending' });
        }
    );
});

// Update leave request
router.put('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { leaveType, startDate, endDate, reason, status } = req.body;

    db.run(
        `UPDATE leave_requests SET leaveType = ?, startDate = ?, endDate = ?, reason = ?, status = ? WHERE id = ?`,
        [leaveType, startDate, endDate, reason, status, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Leave request updated successfully' });
        }
    );
});

// Delete leave request
router.delete('/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    db.run('DELETE FROM leave_requests WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Leave request deleted successfully' });
    });
});

export default router;
