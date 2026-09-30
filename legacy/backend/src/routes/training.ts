import { Router, Request, Response } from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper to promisify database calls
const dbGet = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbRun = (sql: string, params: any[] = []): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Get all training programs
router.get('/programs', async (req: Request, res: Response) => {
    try {
        const programs = await dbAll(`
            SELECT 
                tp.*,
                COUNT(DISTINCT tpart.id) as enrolledCount
            FROM training_programs tp
            LEFT JOIN training_participants tpart ON tp.id = tpart.program_id
            GROUP BY tp.id
            ORDER BY tp.start_date DESC
        `);

        res.json(programs);
    } catch (error: any) {
        console.error('Error fetching programs:', error);
        res.status(500).json({ error: 'Failed to fetch programs', details: error.message });
    }
});

// Get single training program
router.get('/programs/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const program = await dbGet('SELECT * FROM training_programs WHERE id = ?', [id]);

        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }

        const participants = await dbAll(`
            SELECT 
                tp.*,
                e.name as employeeName,
                e.employeeId
            FROM training_participants tp
            JOIN employees e ON tp.employee_id = e.id
            WHERE tp.program_id = ?
        `, [id]);

        res.json({ ...program, participants });
    } catch (error: any) {
        console.error('Error fetching program:', error);
        res.status(500).json({ error: 'Failed to fetch program', details: error.message });
    }
});

// Create new training program
router.post('/programs', async (req: Request, res: Response) => {
    try {
        const { title, description, trainer, startDate, endDate, location, status, maxParticipants } = req.body;
        const id = uuidv4();

        await dbRun(`
            INSERT INTO training_programs (
                id, title, description, trainer, start_date, end_date, location, status, max_participants
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, title, description, trainer, startDate, endDate, location, status || 'Upcoming', maxParticipants || 20]);

        res.status(201).json({ id, message: 'Program created successfully' });
    } catch (error: any) {
        console.error('Error creating program:', error);
        res.status(500).json({ error: 'Failed to create program', details: error.message });
    }
});

// Update training program
router.put('/programs/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, trainer, startDate, endDate, location, status, maxParticipants } = req.body;

        await dbRun(`
            UPDATE training_programs 
            SET title = ?, description = ?, trainer = ?, start_date = ?, end_date = ?, 
                location = ?, status = ?, max_participants = ?
            WHERE id = ?
        `, [title, description, trainer, startDate, endDate, location, status, maxParticipants, id]);

        res.json({ message: 'Program updated successfully' });
    } catch (error: any) {
        console.error('Error updating program:', error);
        res.status(500).json({ error: 'Failed to update program', details: error.message });
    }
});

// Enroll employee in training
router.post('/programs/:id/enroll', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { employeeId } = req.body;
        const enrollmentId = uuidv4();

        await dbRun(`
            INSERT INTO training_participants (id, program_id, employee_id, status)
            VALUES (?, ?, ?, ?)
        `, [enrollmentId, id, employeeId, 'Enrolled']);

        res.status(201).json({ message: 'Employee enrolled successfully' });
    } catch (error: any) {
        console.error('Error enrolling employee:', error);
        res.status(500).json({ error: 'Failed to enroll employee', details: error.message });
    }
});

// Get all certifications
router.get('/certifications', async (req: Request, res: Response) => {
    try {
        const certifications = await dbAll(`
            SELECT 
                ec.*,
                e.name as employeeName,
                e.employeeId
            FROM employee_certifications ec
            JOIN employees e ON ec.employee_id = e.id
            ORDER BY ec.expiry_date ASC
        `);

        // Calculate status based on expiry date
        const now = new Date();
        const certificationsWithStatus = certifications.map(cert => {
            if (!cert.expiry_date) {
                return { ...cert, status: 'Active' };
            }

            const expiryDate = new Date(cert.expiry_date);
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            let status = 'Active';
            if (daysUntilExpiry < 0) {
                status = 'Expired';
            } else if (daysUntilExpiry <= 30) {
                status = 'Expiring Soon';
            }

            return { ...cert, status };
        });

        res.json(certificationsWithStatus);
    } catch (error: any) {
        console.error('Error fetching certifications:', error);
        res.status(500).json({ error: 'Failed to fetch certifications', details: error.message });
    }
});

// Add new certification
router.post('/certifications', async (req: Request, res: Response) => {
    try {
        const { employeeId, certificationName, issuingOrganization, issueDate, expiryDate } = req.body;
        const id = uuidv4();

        await dbRun(`
            INSERT INTO employee_certifications (
                id, employee_id, certification_name, issuing_organization, issue_date, expiry_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [id, employeeId, certificationName, issuingOrganization, issueDate, expiryDate, 'Active']);

        res.status(201).json({ id, message: 'Certification added successfully' });
    } catch (error: any) {
        console.error('Error adding certification:', error);
        res.status(500).json({ error: 'Failed to add certification', details: error.message });
    }
});

// Update certification
router.put('/certifications/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { certificationName, issuingOrganization, issueDate, expiryDate, status } = req.body;

        await dbRun(`
            UPDATE employee_certifications 
            SET certification_name = ?, issuing_organization = ?, issue_date = ?, 
                expiry_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [certificationName, issuingOrganization, issueDate, expiryDate, status, id]);

        res.json({ message: 'Certification updated successfully' });
    } catch (error: any) {
        console.error('Error updating certification:', error);
        res.status(500).json({ error: 'Failed to update certification', details: error.message });
    }
});

export default router;
