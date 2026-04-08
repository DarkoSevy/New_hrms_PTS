import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all candidates
router.get('/', (req: Request, res: Response) => {
    db.all('SELECT * FROM candidates', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get candidates by vacancy
router.get('/vacancy/:vacancyId', (req: Request, res: Response) => {
    const { vacancyId } = req.params;
    db.all('SELECT * FROM candidates WHERE vacancyId = ?', [vacancyId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create candidate
router.post('/', (req: Request, res: Response) => {
    const { vacancyId, name, email, phone, avatarUrl, stage, appliedDate, resumeUrl, notes } = req.body;
    const id = uuidv4();

    db.run(
        `INSERT INTO candidates (id, vacancyId, name, email, phone, avatarUrl, stage, appliedDate, resumeUrl, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, vacancyId, name, email, phone, avatarUrl, stage || 'Sourced', appliedDate, resumeUrl, notes],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id, vacancyId, name, email, phone, stage: stage || 'Sourced', appliedDate });
        }
    );
});

// Update candidate
router.put('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, phone, stage, resumeUrl, notes } = req.body;

    db.run(
        `UPDATE candidates SET name = ?, email = ?, phone = ?, stage = ?, resumeUrl = ?, notes = ? WHERE id = ?`,
        [name, email, phone, stage, resumeUrl, notes, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Candidate updated successfully' });
        }
    );
});

// Delete candidate
router.delete('/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    db.run('DELETE FROM candidates WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Candidate deleted successfully' });
    });
});

export default router;
