import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all vehicles
router.get('/', (req: Request, res: Response) => {
    db.all('SELECT * FROM vehicles', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create vehicle
router.post('/', (req: Request, res: Response) => {
    const { make, model, year, registration, insuranceExpiry, status, assignedTo, lastMaintenance, nextMaintenance, avatarUrl } = req.body;
    const id = uuidv4();

    db.run(
        `INSERT INTO vehicles (id, make, model, year, registration, insuranceExpiry, status, assignedTo, lastMaintenance, nextMaintenance, avatarUrl) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, make, model, year, registration, insuranceExpiry, status, assignedTo, lastMaintenance, nextMaintenance, avatarUrl],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id, make, model, year, registration, status });
        }
    );
});

// Update vehicle
router.put('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { make, model, year, registration, insuranceExpiry, status, assignedTo, lastMaintenance, nextMaintenance } = req.body;

    db.run(
        `UPDATE vehicles SET make = ?, model = ?, year = ?, registration = ?, insuranceExpiry = ?, 
     status = ?, assignedTo = ?, lastMaintenance = ?, nextMaintenance = ? WHERE id = ?`,
        [make, model, year, registration, insuranceExpiry, status, assignedTo, lastMaintenance, nextMaintenance, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Vehicle updated successfully' });
        }
    );
});

// Delete vehicle
router.delete('/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    db.run('DELETE FROM vehicles WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Vehicle deleted successfully' });
    });
});

export default router;
