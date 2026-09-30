import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all employees
router.get('/', (req: Request, res: Response) => {
    db.all('SELECT * FROM employees', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get employee by ID
router.get('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.get('SELECT * FROM employees WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Employee not found' });
            return;
        }
        res.json(row);
    });
});

// Create employee
router.post('/', (req: Request, res: Response) => {
    const { employeeId, name, department, role, status, avatarUrl, location, hireDate } = req.body;
    const id = uuidv4();

    db.run(
        `INSERT INTO employees (id, employeeId, name, department, role, status, avatarUrl, location, hireDate, terminationDate, terminationReason) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, employeeId, name, department, role, status, avatarUrl, location, hireDate, null, null],
        function (err) {
            if (err) {
                console.error('Error creating employee:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id, employeeId, name, department, role, status, avatarUrl, location, hireDate });
        }
    );
});

// Update employee
router.put('/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { employeeId, name, department, role, status, location, hireDate, terminationDate, terminationReason } = req.body;

    db.run(
        `UPDATE employees SET employeeId = ?, name = ?, department = ?, role = ?, status = ?, 
     location = ?, hireDate = ?, terminationDate = ?, terminationReason = ? WHERE id = ?`,
        [employeeId, name, department, role, status, location, hireDate, terminationDate, terminationReason, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Employee not found' });
                return;
            }
            res.json({ message: 'Employee updated successfully' });
        }
    );
});

// Delete employee
router.delete('/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    db.run('DELETE FROM employees WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Employee not found' });
            return;
        }
        res.json({ message: 'Employee deleted successfully' });
    });
});

export default router;
