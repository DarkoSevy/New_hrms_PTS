import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import { uploadEmployeeDocument } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

const router = Router();

// Get all documents for an employee
router.get('/:employeeId/documents', (req: Request, res: Response) => {
    const { employeeId } = req.params;

    db.all(
        'SELECT * FROM employee_documents WHERE employee_id = ? ORDER BY uploaded_at DESC',
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

// Upload a document for an employee
router.post('/:employeeId/documents', uploadEmployeeDocument.single('file'), (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const { document_type, title, issuing_institution, issue_date, expiry_date } = req.body;

    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    const id = uuidv4();
    const uploaded_at = new Date().toISOString();
    const file_path = `uploads/employee-documents/${req.file.filename}`;
    const uploaded_by = (req as any).user?.userId || null; // From auth middleware

    db.run(
        `INSERT INTO employee_documents 
        (id, employee_id, document_type, title, issuing_institution, issue_date, expiry_date, file_path, file_name, file_size, mime_type, uploaded_at, uploaded_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, employeeId, document_type, title, issuing_institution || null, issue_date || null, expiry_date || null,
            file_path, req.file.originalname, req.file.size, req.file.mimetype, uploaded_at, uploaded_by],
        function (err) {
            if (err) {
                // Clean up uploaded file if DB insertion fails
                fs.unlinkSync(req.file!.path);
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({
                id,
                employee_id: employeeId,
                document_type,
                title,
                file_name: req.file!.originalname,
                uploaded_at
            });
        }
    );
});

// Download a document
router.get('/documents/:id/download', (req: Request, res: Response) => {
    const { id } = req.params;

    db.get('SELECT * FROM employee_documents WHERE id = ?', [id], (err, row: any) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        const filePath = path.join(__dirname, '../../', row.file_path);

        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'File not found on server' });
            return;
        }

        res.download(filePath, row.file_name);
    });
});

// Delete a document
router.delete('/documents/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    // First get the document to find file path
    db.get('SELECT * FROM employee_documents WHERE id = ?', [id], (err, row: any) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }

        // Delete from database
        db.run('DELETE FROM employee_documents WHERE id = ?', [id], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Delete file from filesystem
            const filePath = path.join(__dirname, '../../', row.file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            res.json({ message: 'Document deleted successfully' });
        });
    });
});

export default router;
