import { Router, Request, Response } from 'express';
import { generateExecutiveSummary } from '../services/aiService';
import db from '../database';

const router = Router();

// Helper for DB stats
const dbGet = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

router.get('/insights', async (req: Request, res: Response) => {
    try {
        // Gather high-level stats for AI analysis
        const empStats = await dbGet('SELECT COUNT(*) as total, SUM(CASE WHEN status="Active" THEN 1 ELSE 0 END) as active FROM employees');
        const payrollStats = await dbGet('SELECT SUM(total_gross) as totalSpent FROM payroll_runs WHERE status="Completed"');
        const warningStats = await dbGet('SELECT COUNT(*) as warningCount FROM employee_warnings WHERE status="Active"');

        const systemMetrics = {
            totalEmployees: empStats.total,
            activeRate: ((empStats.active / empStats.total) * 100).toFixed(1) + '%',
            totalPayrollExpenditure: payrollStats.totalSpent,
            activeDisciplinaryWarnings: warningStats.warningCount,
            generatedAt: new Date().toISOString()
        };

        const summary = await generateExecutiveSummary(systemMetrics);

        res.json({
            metrics: systemMetrics,
            aiSummary: summary
        });
    } catch (error: any) {
        console.error('AI Insights Route Error:', error);
        res.status(500).json({ error: 'Failed to generate insights', details: error.message });
    }
});

export default router;
