import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all leads
router.get('/', (req: Request, res: Response) => {
    db.all('SELECT * FROM leads', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create lead
router.post('/', (req: Request, res: Response) => {
    const { companyName, contactPerson, email, phone, status, value, source, assignedTo, notes } = req.body;
    const id = uuidv4();
    const createdAt = new Date().toISOString().split('T')[0];

    db.run(
        `INSERT INTO leads (id, companyName, contactPerson, email, phone, status, value, source, assignedTo, createdAt, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyName, contactPerson, email, phone, status || 'New', value, source, assignedTo, createdAt, notes],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id, companyName, contactPerson, email, phone, status: status || 'New', value, createdAt });
        }
    );
});

// Update lead
router.put('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { companyName, contactPerson, email, phone, status, value, source, assignedTo, notes } = req.body;

    db.run(
        `UPDATE leads SET companyName = ?, contactPerson = ?, email = ?, phone = ?, status = ?, 
     value = ?, source = ?, assignedTo = ?, notes = ? WHERE id = ?`,
        [companyName, contactPerson, email, phone, status, value, source, assignedTo, notes, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Lead updated successfully' });
        }
    );
});

// Delete lead
router.delete('/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    db.run('DELETE FROM leads WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Lead deleted successfully' });
    });
});

export default router;
