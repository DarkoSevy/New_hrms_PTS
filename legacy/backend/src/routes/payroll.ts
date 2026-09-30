import { Router, Request, Response } from 'express';
import db from '../database';

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

// Helper to calculate PAYE tax based on Rwandan brackets
const calculatePAYE = (taxableIncome: number): number => {
    let tax = 0;
    if (taxableIncome <= 60000) {
        tax = 0;
    } else if (taxableIncome <= 100000) {
        tax = (taxableIncome - 60000) * 0.2;
    } else {
        tax = (40000 * 0.2) + ((taxableIncome - 100000) * 0.3);
    }
    return Math.round(tax);
};

// Generate Payroll Run
router.post('/generate', async (req: Request, res: Response) => {
    try {
        const { month, year, createdBy } = req.body;

        if (!month || !year || !createdBy) {
            return res.status(400).json({ error: 'Missing required fields: month, year, createdBy' });
        }

        const runId = `${year}-${month.toString().padStart(2, '0')}`;

        // Check if run already exists
        const existingRun = await dbGet('SELECT id FROM payroll_runs WHERE id = ?', [runId]);
        if (existingRun) {
            return res.status(400).json({ error: 'Payroll for this month already exists' });
        }

        // Fetch all active employees
        const employees: any[] = await dbAll('SELECT * FROM employees WHERE status = "Active"', []);

        if (employees.length === 0) {
            return res.status(400).json({ error: 'No active employees found' });
        }

        let totalGross = 0;
        let totalNet = 0;
        let totalPAYE = 0;
        let totalRSSBEmployer = 0;
        let totalMaternityEmployer = 0;

        const records: any[] = [];

        employees.forEach(emp => {
            // Actual salary data from database (with mock fallback only if DB value is NULL or UNDEFINED)
            const basicSalary = emp.basic_salary ?? 500000; 
            console.log(`[PAYROLL GEN] Emp: ${emp.name}, DB Basic: ${emp.basic_salary}, Resolved: ${basicSalary}`);
            const transportAllowance = emp.transport_allowance ?? 50000;
            const housingAllowance = emp.housing_allowance ?? 0;
            const otherAllowances = emp.other_allowances ?? 0;

            // Overtime (Mock data - in real app, fetch from attendance)
            const overtimeHours = 0;
            const overtimeRate = (basicSalary / 173.33) * 1.5; // 150% rate
            const overtimeAmount = overtimeHours * overtimeRate;

            const grossSalary = basicSalary + transportAllowance + housingAllowance + otherAllowances + overtimeAmount;

            // Statutory Deductions
            const rssbEmployee = Math.round(basicSalary * 0.03);
            const rssbEmployer = Math.round(basicSalary * 0.05);

            const maternityEmployee = Math.round(basicSalary * 0.003);
            const maternityEmployer = Math.round(basicSalary * 0.003);

            // Taxable Income = Gross - (Employee Statutory Deductions)
            const taxableIncome = grossSalary - (rssbEmployee + maternityEmployee);

            const payeTax = calculatePAYE(taxableIncome);

            const netSalary = Math.round(grossSalary - rssbEmployee - maternityEmployee - payeTax);

            // Accumulate totals
            totalGross += grossSalary;
            totalNet += netSalary;
            totalPAYE += payeTax;
            totalRSSBEmployer += rssbEmployer;
            totalMaternityEmployer += maternityEmployer;

            records.push({
                id: `${runId}-${emp.id}`,
                runId,
                employeeId: emp.id,
                basicSalary,
                transportAllowance,
                housingAllowance,
                otherAllowances,
                overtimeHours,
                overtimeAmount,
                grossSalary,
                rssbEmployee,
                rssbEmployer,
                maternityEmployee,
                maternityEmployer,
                payeTax,
                netSalary
            });
        });

        // Insert Payroll Run
        await dbRun(
            `INSERT INTO payroll_runs (
                id, month, year, status, total_gross, total_net, total_paye, 
                total_rssb_employer, total_maternity_employer, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                runId, month, year, 'Draft', Math.round(totalGross), Math.round(totalNet),
                Math.round(totalPAYE), Math.round(totalRSSBEmployer), Math.round(totalMaternityEmployer), createdBy
            ]
        );

        // Insert Records
        const stmt = db.prepare(`
            INSERT INTO payroll_records (
                id, run_id, employee_id, basic_salary, allowances_transport, 
                allowances_housing, allowances_other, overtime_hours, overtime_amount,
                gross_salary, rssb_employee, rssb_employer, maternity_employee, 
                maternity_employer, paye_tax, net_salary
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        records.forEach(rec => {
            stmt.run([
                rec.id, rec.runId, rec.employeeId, rec.basicSalary, rec.transportAllowance,
                rec.housingAllowance, rec.otherAllowances, rec.overtimeHours, rec.overtimeAmount,
                rec.grossSalary, rec.rssbEmployee, rec.rssbEmployer, rec.maternityEmployee,
                rec.maternityEmployer, rec.payeTax, rec.netSalary
            ]);
        });

        stmt.finalize();

        res.json({ message: 'Payroll generated successfully', runId });
    } catch (error: any) {
        console.error('Error generating payroll:', error);
        res.status(500).json({ error: 'Failed to generate payroll', details: error.message });
    }
});

// Get Payroll Runs List
router.get('/list', async (req: Request, res: Response) => {
    try {
        const rows = await dbAll('SELECT * FROM payroll_runs ORDER BY created_at DESC', []);
        res.json(rows);
    } catch (error: any) {
        console.error('Error fetching payroll list:', error);
        res.status(500).json({ error: 'Database error', details: error.message });
    }
});

// Get Single Payroll Run Details
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const run = await dbGet('SELECT * FROM payroll_runs WHERE id = ?', [id]);

        if (!run) {
            return res.status(404).json({ error: 'Payroll run not found' });
        }

        const records = await dbAll(
            `SELECT pr.*, e.name, e.employeeId, e.department, e.role 
             FROM payroll_records pr 
             JOIN employees e ON pr.employee_id = e.id 
             WHERE pr.run_id = ?`,
            [id]
        );

        // Map records to match frontend expectations
        const mappedRecords = records.map(rec => ({
            ...rec,
            employeeName: rec.name
        }));

        res.json({ run, records: mappedRecords });
    } catch (error: any) {
        console.error('Error fetching payroll details:', error);
        res.status(500).json({ error: 'Failed to fetch payroll details', details: error.message });
    }
});

// Approve Payroll Step
router.post('/approve', async (req: Request, res: Response) => {
    try {
        const { runId, stage, approverId } = req.body;

        if (!runId || !stage || !approverId) {
            return res.status(400).json({ error: 'Missing required fields: runId, stage, approverId' });
        }

        let updateField = '';
        let nextStatus = '';

        switch (stage) {
            case 'HR':
                updateField = 'approved_by_hr';
                nextStatus = 'Review';
                break;
            case 'Finance':
                updateField = 'approved_by_finance';
                nextStatus = 'Approved';
                break;
            case 'MD':
                updateField = 'approved_by_md';
                nextStatus = 'Finalized';
                break;
            default:
                return res.status(400).json({ error: 'Invalid approval stage' });
        }

        await dbRun(
            `UPDATE payroll_runs SET ${updateField} = ?, status = ? WHERE id = ?`,
            [approverId, nextStatus, runId]
        );

        res.json({ message: `Payroll approved by ${stage}` });
    } catch (error: any) {
        console.error('Error approving payroll:', error);
        res.status(500).json({ error: 'Failed to approve payroll', details: error.message });
    }
});

export default router;
