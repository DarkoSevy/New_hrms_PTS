import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../database.sqlite');
export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = () => {
  db.serialize(() => {
    // Employees table
    db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        employeeId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        avatarUrl TEXT,
        location TEXT,
        hireDate TEXT NOT NULL,
        terminationDate TEXT,
        terminationReason TEXT,
        basic_salary REAL DEFAULT 0,
        transport_allowance REAL DEFAULT 0,
        housing_allowance REAL DEFAULT 0,
        other_allowances REAL DEFAULT 0
      )
    `);

    // Leave requests table
    db.run(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id TEXT PRIMARY KEY,
        employeeId TEXT NOT NULL,
        leaveType TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        days_requested REAL NOT NULL DEFAULT 0,
        reason TEXT NOT NULL,
        status TEXT NOT NULL,
        documentName TEXT,
        documentContent TEXT,
        approved_by TEXT,
        approved_at TEXT,
        rejected_by TEXT,
        rejected_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (employeeId) REFERENCES employees(id)
      )
    `);

    // Leave entitlements table
    db.run(`
      CREATE TABLE IF NOT EXISTS leave_entitlements (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        leave_type TEXT NOT NULL,
        annual_days INTEGER NOT NULL DEFAULT 22,
        used_days REAL DEFAULT 0,
        remaining_days REAL DEFAULT 22,
        year INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (employee_id) REFERENCES employees(id),
        UNIQUE(employee_id, leave_type, year)
      )
    `);

    // Vehicles table
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        registration TEXT UNIQUE NOT NULL,
        insuranceExpiry TEXT NOT NULL,
        status TEXT NOT NULL,
        assignedTo TEXT,
        lastMaintenance TEXT,
        nextMaintenance TEXT,
        avatarUrl TEXT,
        FOREIGN KEY (assignedTo) REFERENCES employees(id)
      )
    `);

    // Driver schedules table
    db.run(`
      CREATE TABLE IF NOT EXISTS driver_schedules (
        id TEXT PRIMARY KEY,
        driverId TEXT NOT NULL,
        vehicleId TEXT NOT NULL,
        date TEXT NOT NULL,
        shift TEXT NOT NULL,
        route TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (driverId) REFERENCES employees(id),
        FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
      )
    `);

    // Leads table
    db.run(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        companyName TEXT NOT NULL,
        contactPerson TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        status TEXT NOT NULL,
        value REAL NOT NULL,
        source TEXT,
        assignedTo TEXT,
        createdAt TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (assignedTo) REFERENCES employees(id)
      )
    `);

    // NOTE: Old payroll_records table - replaced by new schema below (lines 250-272)
    // db.run(`
    //   CREATE TABLE IF NOT EXISTS payroll_records (
    //     id TEXT PRIMARY KEY,
    //     employeeId TEXT NOT NULL,
    //     month TEXT NOT NULL,
    //     basicSalary REAL NOT NULL,
    //     allowances REAL NOT NULL,
    //     deductions REAL NOT NULL,
    //     netSalary REAL NOT NULL,
    //     status TEXT NOT NULL,
    //     paymentDate TEXT,
    //     FOREIGN KEY (employeeId) REFERENCES employees(id)
    //   )
    // `);

    // Vacancies table
    db.run(`
      CREATE TABLE IF NOT EXISTS vacancies (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        status TEXT NOT NULL,
        postedDate TEXT NOT NULL,
        hiringManagerId TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        employmentType TEXT NOT NULL,
        FOREIGN KEY (hiringManagerId) REFERENCES employees(id)
      )
    `);

    // Candidates table
    db.run(`
      CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        vacancyId TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        avatarUrl TEXT,
        stage TEXT NOT NULL,
        appliedDate TEXT NOT NULL,
        resumeUrl TEXT,
        notes TEXT,
        FOREIGN KEY (vacancyId) REFERENCES vacancies(id)
      )
    `);

    // Users table for authentication
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        two_factor_secret TEXT,
        two_factor_enabled BOOLEAN DEFAULT 0
      )
    `);

    // Employee Dependents table (spouse/children for insurance)
    db.run(`
      CREATE TABLE IF NOT EXISTS employee_dependents (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        full_name TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        insurance_enrolled INTEGER DEFAULT 0,
        is_emergency_contact INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    // Employee Documents table (degrees, certificates, qualifications)
    db.run(`
      CREATE TABLE IF NOT EXISTS employee_documents (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        document_type TEXT NOT NULL,
        title TEXT NOT NULL,
        issuing_institution TEXT,
        issue_date TEXT,
        expiry_date TEXT,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
        uploaded_by TEXT,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    // Employee Warnings table (disciplinary records)
    db.run(`
      CREATE TABLE IF NOT EXISTS employee_warnings (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        warning_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        reason TEXT NOT NULL,
        action_taken TEXT,
        issued_by TEXT NOT NULL,
        document_path TEXT,
        status TEXT DEFAULT 'Active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (issued_by) REFERENCES employees(id)
      )
    `);

    // Migrate: Add financial columns to employees if they don't exist
    db.run(`ALTER TABLE employees ADD COLUMN basic_salary REAL DEFAULT 0`, () => { });
    db.run(`ALTER TABLE employees ADD COLUMN transport_allowance REAL DEFAULT 0`, () => { });
    db.run(`ALTER TABLE employees ADD COLUMN housing_allowance REAL DEFAULT 0`, () => { });
    db.run(`ALTER TABLE employees ADD COLUMN other_allowances REAL DEFAULT 0`, () => { });


    // Audit logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL DEFAULT 'system',
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        changes TEXT,
        ip_address TEXT,
        severity TEXT NOT NULL DEFAULT 'info',
        description TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migrate: add missing columns to existing audit_logs tables
    db.run(`ALTER TABLE audit_logs ADD COLUMN username TEXT NOT NULL DEFAULT 'system'`, () => {});
    db.run(`ALTER TABLE audit_logs ADD COLUMN severity TEXT NOT NULL DEFAULT 'info'`, () => {});
    db.run(`ALTER TABLE audit_logs ADD COLUMN description TEXT`, () => {});

    // Payroll Runs table
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
      if (err) console.error('❌ Error creating payroll_runs table:', err);
      else console.log('✓ payroll_runs table created');
    });

    // Payroll Records table
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
      if (err) console.error('❌ Error creating payroll_records table:', err);
      else console.log('✓ payroll_records table created');
    });

    // Attendance Records table
    db.run(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        clock_in TEXT,
        clock_out TEXT,
        overtime_hours REAL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(employee_id) REFERENCES employees(id)
      )
    `);

    // Performance Reviews table
    db.run(`
      CREATE TABLE IF NOT EXISTS performance_reviews (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        review_period TEXT NOT NULL,
        overall_rating INTEGER,
        feedback TEXT,
        strengths TEXT,
        improvements TEXT,
        goals TEXT,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(employee_id) REFERENCES employees(id),
        FOREIGN KEY(reviewer_id) REFERENCES employees(id)
      )
    `);

    // Migrate: add strengths and improvements if they don't exist
    db.run(`ALTER TABLE performance_reviews ADD COLUMN strengths TEXT`, () => {});
    db.run(`ALTER TABLE performance_reviews ADD COLUMN improvements TEXT`, () => {});

    // Training Programs table
    db.run(`
      CREATE TABLE IF NOT EXISTS training_programs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        trainer TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        location TEXT,
        status TEXT NOT NULL,
        category TEXT,
        max_participants INTEGER DEFAULT 20,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Training Participants table
    db.run(`
      CREATE TABLE IF NOT EXISTS training_participants (
        id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL,
        employee_id TEXT NOT NULL,
        status TEXT NOT NULL,
        completion_date TEXT,
        certificate_url TEXT,
        FOREIGN KEY(program_id) REFERENCES training_programs(id),
        FOREIGN KEY(employee_id) REFERENCES employees(id)
      )
    `);

    // Performance Goals table
    db.run(`
      CREATE TABLE IF NOT EXISTS performance_goals (
        id TEXT PRIMARY KEY,
        review_id TEXT,
        employee_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        target_date TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(review_id) REFERENCES performance_reviews(id),
        FOREIGN KEY(employee_id) REFERENCES employees(id)
      )
    `, (err) => {
      if (err) console.error('❌ Error creating performance_goals table:', err);
      else console.log('✓ performance_goals table created');
    });

    // Employee Certifications table
    db.run(`
      CREATE TABLE IF NOT EXISTS employee_certifications (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        certification_name TEXT NOT NULL,
        issuing_organization TEXT,
        issue_date TEXT NOT NULL,
        expiry_date TEXT,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(employee_id) REFERENCES employees(id)
      )
    `, (err) => {
      if (err) console.error('❌ Error creating employee_certifications table:', err);
      else console.log('✓ employee_certifications table created');
    });

    // Disciplinary Cases table (extends employee_warnings for comprehensive case management)
    db.run(`
      CREATE TABLE IF NOT EXISTS disciplinary_cases (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        case_type TEXT NOT NULL,
        date TEXT NOT NULL,
        reason TEXT NOT NULL,
        action_taken TEXT,
        status TEXT NOT NULL,
        reported_by TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(employee_id) REFERENCES employees(id)
      )
    `, (err) => {
      if (err) console.error('❌ Error creating disciplinary_cases table:', err);
      else console.log('✓ disciplinary_cases table created');
    });

    console.log('Database initialized successfully');
  });
};

export default db;
