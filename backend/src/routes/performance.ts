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

// Get all performance reviews
router.get('/reviews', async (req: Request, res: Response) => {
    try {
        const reviews = await dbAll(`
            SELECT 
                pr.*,
                pr.overall_rating as rating,
                pr.review_period as period,
                e.name as employeeName,
                e.employeeId,
                r.name as reviewerName
            FROM performance_reviews pr
            JOIN employees e ON pr.employee_id = e.id
            JOIN employees r ON pr.reviewer_id = r.id
            ORDER BY pr.created_at DESC
        `);

        // Get goals for each review
        const reviewsWithGoals = await Promise.all(reviews.map(async (review) => {
            const goals = await dbAll(
                'SELECT *, target_date as dueDate FROM performance_goals WHERE review_id = ? OR employee_id = ?',
                [review.id, review.employee_id]
            );
            return { ...review, goals };
        }));

        res.json(reviewsWithGoals);
    } catch (error: any) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews', details: error.message });
    }
});

// Get single performance review
router.get('/reviews/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const review = await dbGet(`
            SELECT 
                pr.*,
                pr.overall_rating as rating,
                pr.review_period as period,
                e.name as employeeName,
                e.employeeId,
                r.name as reviewerName
            FROM performance_reviews pr
            JOIN employees e ON pr.employee_id = e.id
            JOIN employees r ON pr.reviewer_id = r.id
            WHERE pr.id = ?
        `, [id]);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const goals = await dbAll('SELECT *, target_date as dueDate FROM performance_goals WHERE review_id = ?', [id]);
        res.json({ ...review, goals });
    } catch (error: any) {
        console.error('Error fetching review:', error);
        res.status(500).json({ error: 'Failed to fetch review', details: error.message });
    }
});

// Create new performance review
router.post('/reviews', async (req: Request, res: Response) => {
    try {
        const { employeeId, reviewerId, period, rating, feedback, strengths, improvements, status } = req.body;
        const id = uuidv4();

        await dbRun(`
            INSERT INTO performance_reviews (
                id, employee_id, reviewer_id, review_period, overall_rating, feedback, strengths, improvements, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, employeeId, reviewerId, period, rating, feedback, strengths, improvements, status || 'Draft']);

        res.status(201).json({ id, message: 'Review created successfully' });
    } catch (error: any) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review', details: error.message });
    }
});

// Update performance review
router.put('/reviews/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { rating, feedback, status } = req.body;

        await dbRun(`
            UPDATE performance_reviews 
            SET overall_rating = ?, feedback = ?, status = ?
            WHERE id = ?
        `, [rating, feedback, status, id]);

        res.json({ message: 'Review updated successfully' });
    } catch (error: any) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'Failed to update review', details: error.message });
    }
});

// Get all goals
router.get('/goals', async (req: Request, res: Response) => {
    try {
        const goals = await dbAll(`
            SELECT 
                pg.*,
                pg.target_date as dueDate,
                e.name as employeeName,
                e.employeeId
            FROM performance_goals pg
            JOIN employees e ON pg.employee_id = e.id
            ORDER BY pg.created_at DESC
        `);

        res.json(goals);
    } catch (error: any) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ error: 'Failed to fetch goals', details: error.message });
    }
});

// Create new goal
router.post('/goals', async (req: Request, res: Response) => {
    try {
        const { reviewId, employeeId, title, description, targetDate, status } = req.body;
        const id = uuidv4();

        await dbRun(`
            INSERT INTO performance_goals (
                id, review_id, employee_id, title, description, target_date, status, progress
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, reviewId, employeeId, title, description, targetDate, status || 'Not Started', 0]);

        res.status(201).json({ id, message: 'Goal created successfully' });
    } catch (error: any) {
        console.error('Error creating goal:', error);
        res.status(500).json({ error: 'Failed to create goal', details: error.message });
    }
});

// Update goal progress
router.put('/goals/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { progress, status } = req.body;

        await dbRun(`
            UPDATE performance_goals 
            SET progress = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [progress, status, id]);

        res.json({ message: 'Goal updated successfully' });
    } catch (error: any) {
        console.error('Error updating goal:', error);
        res.status(500).json({ error: 'Failed to update goal', details: error.message });
    }
});

export default router;
