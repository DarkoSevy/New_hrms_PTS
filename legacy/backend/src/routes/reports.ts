import { Router, Request, Response } from 'express';
import db from '../database';

const router = Router();

// Helper to promisify database calls
const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbGet = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Employee Demographics Report
router.get('/employee-demographics', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const byDepartment = await dbAll(`
            SELECT department, COUNT(*) as count, status
            FROM employees
            WHERE hireDate BETWEEN COALESCE(?, '1900-01-01') AND COALESCE(?, '2100-12-31')
            GROUP BY department, status
        `, [startDate, endDate]);

        const byRole = await dbAll(`
            SELECT role, COUNT(*) as count
            FROM employees
            WHERE status = 'Active'
            GROUP BY role
            ORDER BY count DESC
        `);

        const byLocation = await dbAll(`
            SELECT location, COUNT(*) as count
            FROM employees
            WHERE status = 'Active'
            GROUP BY location
        `);

        res.json({
            byDepartment,
            byRole,
            byLocation,
            generatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error generating demographics report:', error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
});

// Attendance Summary Report
router.get('/attendance-summary', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const summary = await dbAll(`
            SELECT 
                status,
                COUNT(*) as count,
                date
            FROM attendance_records
            WHERE date BETWEEN COALESCE(?, '1900-01-01') AND COALESCE(?, '2100-12-31')
            GROUP BY status, date
            ORDER BY date DESC
        `, [startDate, endDate]);

        const overtimeSummary = await dbAll(`
            SELECT 
                e.name,
                e.employeeId,
                SUM(ar.overtime_hours) as totalOvertime
            FROM attendance_records ar
            JOIN employees e ON ar.employee_id = e.id
            WHERE ar.date BETWEEN COALESCE(?, '1900-01-01') AND COALESCE(?, '2100-12-31')
            GROUP BY ar.employee_id
            ORDER BY totalOvertime DESC
            LIMIT 10
        `, [startDate, endDate]);

        res.json({
            summary,
            overtimeSummary,
            generatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error generating attendance report:', error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
});

// Performance Analysis Report
router.get('/performance-analysis', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const ratingDistribution = await dbAll(`
            SELECT 
                overall_rating,
                COUNT(*) as count
            FROM performance_reviews
            WHERE created_at BETWEEN COALESCE(?, '1900-01-01') AND COALESCE(?, '2100-12-31')
            GROUP BY overall_rating
            ORDER BY overall_rating DESC
        `, [startDate, endDate]);

        const topPerformers = await dbAll(`
            SELECT 
                e.name,
                e.employeeId,
                e.department,
                pr.overall_rating,
                pr.review_period
            FROM performance_reviews pr
            JOIN employees e ON pr.employee_id = e.id
            WHERE pr.overall_rating >= 4
            ORDER BY pr.overall_rating DESC
            LIMIT 10
        `);

        const goalCompletion = await dbAll(`
            SELECT 
                status,
                COUNT(*) as count
            FROM performance_goals
            GROUP BY status
        `);

        res.json({
            ratingDistribution,
            topPerformers,
            goalCompletion,
            generatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error generating performance report:', error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
});

// Payroll Summary Report
router.get('/payroll-summary', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const monthlySummary = await dbAll(`
            SELECT 
                pr.month,
                pr.year,
                pr.total_gross,
                pr.total_net,
                pr.total_paye,
                pr.status
            FROM payroll_runs pr
            WHERE pr.created_at BETWEEN COALESCE(?, '1900-01-01') AND COALESCE(?, '2100-12-31')
            ORDER BY pr.year DESC, pr.month DESC
        `, [startDate, endDate]);

        const departmentBreakdown = await dbAll(`
            SELECT 
                e.department,
                SUM(prc.gross_salary) as totalGross,
                SUM(prc.net_salary) as totalNet,
                COUNT(DISTINCT prc.employee_id) as employeeCount
            FROM payroll_records prc
            JOIN employees e ON prc.employee_id = e.id
            GROUP BY e.department
            ORDER BY totalGross DESC
        `);

        res.json({
            monthlySummary,
            departmentBreakdown,
            generatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error generating payroll report:', error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
});

// Training Completion Report
router.get('/training-completion', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const programStatus = await dbAll(`
            SELECT 
                tp.title,
                tp.status,
                tp.start_date,
                tp.end_date,
                COUNT(tpart.id) as enrolledCount
            FROM training_programs tp
            LEFT JOIN training_participants tpart ON tp.id = tpart.program_id
            WHERE tp.start_date BETWEEN COALESCE(?, '1900-01-01') AND COALESCE(?, '2100-12-31')
            GROUP BY tp.id
            ORDER BY tp.start_date DESC
        `, [startDate, endDate]);

        const completionRates = await dbAll(`
            SELECT 
                e.name,
                e.employeeId,
                COUNT(CASE WHEN tpart.status = 'Completed' THEN 1 END) as completedPrograms,
                COUNT(tpart.id) as totalEnrolled
            FROM training_participants tpart
            JOIN employees e ON tpart.employee_id = e.id
            GROUP BY tpart.employee_id
        `);

        res.json({
            programStatus,
            completionRates,
            generatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error generating training report:', error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
});

// Leave Balance Report
router.get('/leave-balance', async (req: Request, res: Response) => {
    try {
        const currentYear = new Date().getFullYear();

        const balances = await dbAll(`
            SELECT 
                e.name,
                e.employeeId,
                e.department,
                le.leave_type,
                le.annual_days,
                le.used_days,
                le.remaining_days
            FROM leave_entitlements le
            JOIN employees e ON le.employee_id = e.id
            WHERE le.year = ?
            ORDER BY e.name, le.leave_type
        `, [currentYear]);

        const utilizationStats = await dbAll(`
            SELECT 
                leave_type,
                AVG(used_days) as avgUsed,
                AVG(remaining_days) as avgRemaining
            FROM leave_entitlements
            WHERE year = ?
            GROUP BY leave_type
        `, [currentYear]);

        res.json({
            balances,
            utilizationStats,
            year: currentYear,
            generatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error generating leave balance report:', error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
});

// Turnover Analysis Report
router.get('/turnover-analysis', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const terminated = await dbAll(`
            SELECT 
                e.name,
                e.employeeId,
                e.department,
                e.role,
                e.terminationDate,
                e.terminationReason
            FROM employees e
            WHERE e.status = 'Terminated'
            AND e.terminationDate BETWEEN COALESCE(?, '1900-01-01') AND COALESCE(?, '2100-12-31')
            ORDER BY e.terminationDate DESC
        `, [startDate, endDate]);

        const byDepartment = await dbAll(`
            SELECT 
                department,
                COUNT(*) as count
            FROM employees
            WHERE status = 'Terminated'
            AND terminationDate BETWEEN COALESCE(?, '1900-01-01') AND COALESCE(?, '2100-12-31')
            GROUP BY department
        `, [startDate, endDate]);

        const totalActive = await dbGet(`
            SELECT COUNT(*) as count FROM employees WHERE status = 'Active'
        `);

        res.json({
            terminated,
            byDepartment,
            totalActive: totalActive?.count || 0,
            turnoverRate: terminated.length > 0 && totalActive ?
                ((terminated.length / (totalActive.count + terminated.length)) * 100).toFixed(2) : 0,
            generatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error generating turnover report:', error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
});

// Certification Expiry Report
router.get('/certification-expiry', async (req: Request, res: Response) => {
    try {
        const expiringSoon = await dbAll(`
            SELECT 
                ec.*,
                e.name as employeeName,
                e.employeeId,
                e.department
            FROM employee_certifications ec
            JOIN employees e ON ec.employee_id = e.id
            WHERE ec.expiry_date IS NOT NULL
            AND date(ec.expiry_date) <= date('now', '+90 days')
            ORDER BY ec.expiry_date ASC
        `);

        const expired = await dbAll(`
            SELECT 
                ec.*,
                e.name as employeeName,
                e.employeeId,
                e.department
            FROM employee_certifications ec
            JOIN employees e ON ec.employee_id = e.id
            WHERE ec.expiry_date IS NOT NULL
            AND date(ec.expiry_date) < date('now')
            ORDER BY ec.expiry_date DESC
        `);

        res.json({
            expiringSoon,
            expired,
            generatedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error generating certification expiry report:', error);
        res.status(500).json({ error: 'Failed to generate report', details: error.message });
    }
});

export default router;
