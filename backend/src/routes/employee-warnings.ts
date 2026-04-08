import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import { uploadWarningDocument } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

const router = Router();

// Get all warnings for an employee
router.get('/:employeeId/warnings', (req: Request, res: Response) => {
    const { employeeId } = req.params;

    db.all(
        `SELECT w.*, e.name as issued_by_name 
         FROM employee_warnings w
         LEFT JOIN employees e ON w.issued_by = e.id
         WHERE w.employee_id = ? 
         ORDER BY w.issue_date DESC`,
        [employeeId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// Create a warning for an employee
router.post('/:employeeId/warnings', uploadWarningDocument.single('document'), (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const { warning_type, severity, issue_date, reason, action_taken, issued_by } = req.body;

    const id = uuidv4();
    const created_at = new Date().toISOString();
    let document_path = null;

    if (req.file) {
        document_path = `uploads/warning-documents/${req.file.filename}`;
    }

    db.run(
        `INSERT INTO employee_warnings 
        (id, employee_id, warning_type, severity, issue_date, reason, action_taken, issued_by, document_path, status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)`,
        [id, employeeId, warning_type, severity, issue_date, reason, action_taken || null, issued_by, document_path, created_at, created_at],
        function (err) {
            if (err) {
                // Clean up uploaded file if DB insertion fails
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({
                id,
                employee_id: employeeId,
                warning_type,
                severity,
                issue_date,
                reason,
                created_at
            });
        }
    );
});

// Update a warning
router.put('/warnings/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { warning_type, severity, reason, action_taken, status } = req.body;
    const updated_at = new Date().toISOString();

    db.run(
        `UPDATE employee_warnings 
        SET warning_type = ?, severity = ?, reason = ?, action_taken = ?, status = ?, updated_at = ? 
        WHERE id = ?`,
        [warning_type, severity, reason, action_taken || null, status, updated_at, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Warning not found' });
                return;
            }
            res.json({ message: 'Warning updated successfully' });
        }
    );
});

// Delete a warning
router.delete('/warnings/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    // First get the warning to find document path
    db.get('SELECT * FROM employee_warnings WHERE id = ?', [id], (err, row: any) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Warning not found' });
            return;
        }

        // Delete from database
        db.run('DELETE FROM employee_warnings WHERE id = ?', [id], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Delete document file if exists
            if (row.document_path) {
                const filePath = path.join(__dirname, '../../', row.document_path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            res.json({ message: 'Warning deleted successfully' });
        });
    });
});

// Download warning document
router.get('/warnings/:id/document', (req: Request, res: Response) => {
    const { id } = req.params;

    db.get('SELECT * FROM employee_warnings WHERE id = ?', [id], (err, row: any) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row || !row.document_path) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        const filePath = path.join(__dirname, '../../', row.document_path);

        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'File not found on server' });
            return;
        }

        res.download(filePath);
    });
});

export default router;
