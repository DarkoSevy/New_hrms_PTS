import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all schedules
router.get('/', (req: Request, res: Response) => {
    const query = `
        SELECT ds.*, e.name as driverName, v.make || ' ' || v.model as vehicleName
        FROM driver_schedules ds
        LEFT JOIN employees e ON ds.driverId = e.id
        LEFT JOIN vehicles v ON ds.vehicleId = v.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create schedule
router.post('/', (req: Request, res: Response) => {
    const { driverId, vehicleId, date, shift, route, status } = req.body;
    const id = uuidv4();

    db.run(
        `INSERT INTO driver_schedules (id, driverId, vehicleId, date, shift, route, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, driverId, vehicleId, date, shift, route, status || 'Scheduled'],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id, driverId, vehicleId, date, shift, route, status: status || 'Scheduled' });
        }
    );
});

// Update schedule
router.put('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { driverId, vehicleId, date, shift, route, status } = req.body;

    db.run(
        `UPDATE driver_schedules SET driverId = ?, vehicleId = ?, date = ?, shift = ?, route = ?, status = ? WHERE id = ?`,
        [driverId, vehicleId, date, shift, route, status, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Schedule updated successfully' });
        }
    );
});

// Delete schedule
router.delete('/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    db.run('DELETE FROM driver_schedules WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Schedule deleted successfully' });
    });
});

export default router;
