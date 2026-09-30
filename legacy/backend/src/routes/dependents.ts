import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all dependents for an employee
router.get('/:employeeId/dependents', (req: Request, res: Response) => {
    const { employeeId } = req.params;

    db.all(
        'SELECT * FROM employee_dependents WHERE employee_id = ? ORDER BY created_at DESC',
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

// Add a dependent to an employee
router.post('/:employeeId/dependents', (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const { full_name, birth_date, relationship_type, insurance_enrolled, is_emergency_contact } = req.body;

    const id = uuidv4();
    const created_at = new Date().toISOString();

    db.run(
        `INSERT INTO employee_dependents 
        (id, employee_id, full_name, birth_date, relationship_type, insurance_enrolled, is_emergency_contact, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, employeeId, full_name, birth_date, relationship_type, insurance_enrolled ? 1 : 0, is_emergency_contact ? 1 : 0, created_at, created_at],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({
                id,
                employee_id: employeeId,
                full_name,
                birth_date,
                relationship_type,
                insurance_enrolled,
                is_emergency_contact,
                created_at
            });
        }
    );
});

// Update a dependent
router.put('/dependents/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { full_name, birth_date, relationship_type, insurance_enrolled, is_emergency_contact } = req.body;
    const updated_at = new Date().toISOString();

    db.run(
        `UPDATE employee_dependents 
        SET full_name = ?, birth_date = ?, relationship_type = ?, insurance_enrolled = ?, is_emergency_contact = ?, updated_at = ? 
        WHERE id = ?`,
        [full_name, birth_date, relationship_type, insurance_enrolled ? 1 : 0, is_emergency_contact ? 1 : 0, updated_at, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Dependent not found' });
                return;
            }
            res.json({ message: 'Dependent updated successfully' });
        }
    );
});

// Delete a dependent
router.delete('/dependents/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    db.run('DELETE FROM employee_dependents WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Dependent not found' });
            return;
        }
        res.json({ message: 'Dependent deleted successfully' });
    });
});

export default router;
