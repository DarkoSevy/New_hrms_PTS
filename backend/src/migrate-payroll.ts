// Migration script to update payroll tables
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting payroll tables migration...');

db.serialize(() => {
    // Drop old payroll_records table
    db.run('DROP TABLE IF EXISTS payroll_records', (err) => {
        if (err) {
            console.error('Error dropping payroll_records:', err);
        } else {
            console.log('✓ Dropped old payroll_records table');
        }
    });

    // Create new payroll_runs table
    db.run(`
        CREATE TABLE IF NOT EXISTS payroll_runs (
            id TEXT PRIMARY KEY,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            status TEXT NOT NULL,
            total_gross REAL DEFAULT 0,
            total_net REAL DEFAULT 0,
            total_paye REAL DEFAULT 0,
            total_rssb_employer REAL DEFAULT 0,
            total_maternity_employer REAL DEFAULT 0,
            created_by TEXT,
            approved_by_hr TEXT,
            approved_by_finance TEXT,
            approved_by_md TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating payroll_runs:', err);
        } else {
            console.log('✓ Created payroll_runs table');
        }
    });

    // Create new payroll_records table
    db.run(`
        CREATE TABLE IF NOT EXISTS payroll_records (
            id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            employee_id TEXT NOT NULL,
            basic_salary REAL DEFAULT 0,
            allowances_transport REAL DEFAULT 0,
            allowances_housing REAL DEFAULT 0,
            allowances_other REAL DEFAULT 0,
            overtime_hours REAL DEFAULT 0,
            overtime_amount REAL DEFAULT 0,
            gross_salary REAL DEFAULT 0,
            rssb_employee REAL DEFAULT 0,
            rssb_employer REAL DEFAULT 0,
            maternity_employee REAL DEFAULT 0,
            maternity_employer REAL DEFAULT 0,
            paye_tax REAL DEFAULT 0,
            net_salary REAL DEFAULT 0,
            FOREIGN KEY(run_id) REFERENCES payroll_runs(id),
            FOREIGN KEY(employee_id) REFERENCES employees(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating payroll_records:', err);
        } else {
            console.log('✓ Created new payroll_records table');
            console.log('\n✅ Migration completed successfully!');
            db.close();
        }
    });
});
