import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all vacancies
router.get('/', (req: Request, res: Response) => {
    db.all('SELECT * FROM vacancies', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create vacancy
router.post('/', (req: Request, res: Response) => {
    const { title, department, status, postedDate, hiringManagerId, description, location, employmentType } = req.body;
    const id = uuidv4();

    db.run(
        `INSERT INTO vacancies (id, title, department, status, postedDate, hiringManagerId, description, location, employmentType) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, department, status || 'Open', postedDate, hiringManagerId, description, location, employmentType],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id, title, department, status: status || 'Open', postedDate });
        }
    );
});

// Update vacancy
router.put('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, department, status, description, location, employmentType } = req.body;

    db.run(
        `UPDATE vacancies SET title = ?, department = ?, status = ?, description = ?, location = ?, employmentType = ? WHERE id = ?`,
        [title, department, status, description, location, employmentType, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Vacancy updated successfully' });
        }
    );
});

// Delete vacancy
router.delete('/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    db.run('DELETE FROM vacancies WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Vacancy deleted successfully' });
    });
});

export default router;
