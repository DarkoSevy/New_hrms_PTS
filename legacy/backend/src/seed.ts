import db from './database';

export const seedDatabase = () => {
    // Seed employees
    const employees = [
        ['1', 'EMP001', 'John Doe', 'Engineering', 'Frontend Developer', 'Active', 'https://randomuser.me/api/portraits/men/1.jpg', 'New York', '2022-03-15', null, null, 1200000, 100000, 200000, 50000],
        ['2', 'EMP002', 'Jane Smith', 'Marketing', 'Marketing Manager', 'Active', 'https://randomuser.me/api/portraits/women/2.jpg', 'San Francisco', '2021-07-01', null, null, 1800000, 150000, 300000, 75000],
        ['3', 'EMP003', 'Peter Jones', 'Sales', 'Sales Executive', 'OnLeave', 'https://randomuser.me/api/portraits/men/3.jpg', 'New York', '2023-01-20', null, null, 900000, 80000, 150000, 25000],
        ['4', 'EMP004', 'Sarah Wilson', 'HR', 'HR Specialist', 'Active', 'https://randomuser.me/api/portraits/women/4.jpg', 'London', '2022-11-05', null, null, 1500000, 120000, 250000, 60000],
        ['5', 'EMP005', 'Michael Brown', 'Finance', 'Accountant', 'Terminated', 'https://randomuser.me/api/portraits/men/5.jpg', 'New York', '2020-05-10', '2023-12-15', 'Resignation', 1400000, 110000, 220000, 45000],
    ];

    // Seed default user for login
    const users = [
        ['user1', 'admin', '$2b$10$zvHGF0.0MsFqLxCiiUsAcu9Dcd3bNqtrht4MB2T.AhI3t8v8iHVR.', 'admin@pts.com', 'Administrator', 'Active', new Date().toISOString(), null, 0],
    ];

    // Seed Attendance Records
    const attendanceRecords = [
        ['at1', '1', '2024-12-01', 'Present', '09:00', '17:00', 0, ''],
        ['at2', '1', '2024-12-02', 'Present', '09:05', '17:15', 0.25, ''],
        ['at3', '1', '2024-12-03', 'Absent', null, null, 0, 'Sick Leave'],
        ['at4', '2', '2024-12-01', 'Present', '08:45', '17:30', 0.5, ''],
        ['at5', '2', '2024-12-02', 'Present', '09:00', '17:00', 0, ''],
    ];

    // Seed Performance Reviews
    // Schema: id, employee_id, reviewer_id, review_period, overall_rating, feedback, created_at, status
    const performanceReviews = [
        ['pr1', '1', '2', '2024-Q3', 4.5, 'Excellent performance, met all goals.', new Date().toISOString(), 'Completed'],
        ['pr2', '2', '1', '2024-Q3', 3.8, 'Good performance, some areas for improvement.', new Date().toISOString(), 'Completed'],
        ['pr3', '3', '2', '2024-Q3', 3.0, 'Average performance.', new Date().toISOString(), 'Completed'],
    ];

    // Seed Payroll Runs
    // Schema: id, month, year, total_gross, total_net, total_paye, status, created_at
    const payrollRuns = [
        ['run1', 11, 2024, 150000, 110000, 40000, 'Completed', '2024-11-25'],
        ['run2', 12, 2024, 150000, 110000, 40000, 'Completed', '2024-12-25'],
    ];

    // Seed Payroll Records
    // Schema: id, run_id, employee_id, gross_salary, net_salary, paye_tax, rssb_employee
    const payrollRecords = [
        ['rec1', 'run2', '1', 5000, 4000, 500, 100],
        ['rec2', 'run2', '2', 6000, 4800, 600, 120],
        ['rec3', 'run2', '3', 4500, 3600, 450, 90],
    ];

    // Seed Training Programs
    // Schema: id, title, description, location, start_date, end_date, trainer, max_participants, status
    // Data matched to: tp1 (Internal), tp2 (External which we mapped to trainer)
    // Note: Removed 'category', 'provider'. Mapped Instructor->Trainer.
    const trainingPrograms = [
        ['tp1', 'Advanced React Patterns', 'Technical', 'Online', '2024-11-01', '2024-11-05', 'John Doe', 20, 'Completed', 'Technical'],
        ['tp2', 'Leadership 101', 'Soft Skills', 'New York Office', '2024-12-10', '2024-12-12', 'External Coach', 15, 'Upcoming', 'Leadership'],
        ['tp3', 'Modern HR Practices', 'Compliance', 'London Office', '2024-12-15', '2024-12-17', 'Jane Smith', 25, 'Ongoing', 'Compliance'],
    ];

    // Seed Training Participants
    // Schema: id, program_id, employee_id, status, completion_date, certificate_url
    const trainingParticipants = [
        ['part1', 'tp1', '1', 'Completed', '2024-11-06', null],
        ['part2', 'tp1', '2', 'In Progress', null, null]
    ];

    // Seed Leave Entitlements
    const leaveEntitlements = [
        ['le1', '1', 'Annual Leave', 20, 10, 10, 2024],
        ['le2', '1', 'Sick Leave', 10, 2, 8, 2024],
        ['le3', '2', 'Annual Leave', 20, 5, 15, 2024],
    ];

    // Seed Certifications
    const certifications = [
        ['cert1', '1', 'AWS Certified Developer', 'AWS', '2022-06-01', '2025-06-01', 'Active'],
        ['cert2', '2', 'PMP Certification', 'PMI', '2021-05-15', '2024-05-15', 'Expired'],
    ];


    db.serialize(() => {
        // Employees
        db.get('SELECT COUNT(*) as count FROM employees', (err, row: any) => {
            if (!err && row.count === 0) {
                console.log('Seeding employees...');
                const stmt = db.prepare('INSERT INTO employees VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                employees.forEach(emp => stmt.run(emp));
                stmt.finalize();
                console.log('✓ Employees seeded');
            }
        });

        // Users
        db.get('SELECT COUNT(*) as count FROM users', (err, row: any) => {
            if (!err && row.count === 0) {
                console.log('Seeding default user...');
                const stmt = db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                users.forEach(user => stmt.run(user));
                stmt.finalize();
                console.log('✓ Default user seeded');
            }
        });

        // Attendance
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance_records'", (err, row) => {
            if (!row) return;
            db.get('SELECT COUNT(*) as count FROM attendance_records', (err, row: any) => {
                if (!err && row.count === 0) {
                    console.log('Seeding attendance...');
                    const stmt = db.prepare('INSERT INTO attendance_records (id, employee_id, date, status, clock_in, clock_out, overtime_hours, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                    attendanceRecords.forEach(rec => stmt.run(rec));
                    stmt.finalize();
                    console.log('✓ Attendance seeded');
                }
            });
        });

        // Performance
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='performance_reviews'", (err, row) => {
            if (!row) return;
            db.get('SELECT COUNT(*) as count FROM performance_reviews', (err, row: any) => {
                if (!err && row.count === 0) {
                    console.log('Seeding performance reviews...');
                    const stmt = db.prepare('INSERT INTO performance_reviews (id, employee_id, reviewer_id, review_period, overall_rating, feedback, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                    performanceReviews.forEach(rec => stmt.run(rec));
                    stmt.finalize();
                    console.log('✓ Performance reviews seeded');
                }
            });
        });

        // Payroll Runs
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='payroll_runs'", (err, row) => {
            if (!row) return;
            db.get('SELECT COUNT(*) as count FROM payroll_runs', (err, row: any) => {
                if (!err && row.count === 0) {
                    console.log('Seeding payroll runs...');
                    const stmt = db.prepare('INSERT INTO payroll_runs (id, month, year, total_gross, total_net, total_paye, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                    payrollRuns.forEach(rec => stmt.run(rec));
                    stmt.finalize();
                    console.log('✓ Payroll runs seeded');

                    // Seed Records only if Run seeding happens
                    const recStmt = db.prepare('INSERT INTO payroll_records (id, run_id, employee_id, gross_salary, net_salary, paye_tax, rssb_employee) VALUES (?, ?, ?, ?, ?, ?, ?)');
                    payrollRecords.forEach(rec => recStmt.run(rec));
                    recStmt.finalize();
                    console.log('✓ Payroll records seeded');

                }
            });
        });


        // Training
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='training_programs'", (err, row) => {
            if (!row) return;
            db.get('SELECT COUNT(*) as count FROM training_programs', (err, row: any) => {
                if (!err && row.count === 0) {
                    console.log('Seeding training programs...');
                    const stmt = db.prepare('INSERT INTO training_programs (id, title, description, location, start_date, end_date, trainer, max_participants, status, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                    trainingPrograms.forEach(rec => stmt.run(rec));
                    stmt.finalize();
                    console.log('✓ Training programs seeded');

                    const partStmt = db.prepare('INSERT INTO training_participants (id, program_id, employee_id, status, completion_date, certificate_url) VALUES (?, ?, ?, ?, ?, ?)');
                    trainingParticipants.forEach(rec => partStmt.run(rec));
                    partStmt.finalize();
                    console.log('✓ Training participants seeded');
                }
            });
        });


        // Leave Entitlements
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='leave_entitlements'", (err, row) => {
            if (!row) return;
            db.get('SELECT COUNT(*) as count FROM leave_entitlements', (err, row: any) => {
                if (!err && row.count === 0) {
                    console.log('Seeding leave entitlements...');
                    const stmt = db.prepare('INSERT INTO leave_entitlements (id, employee_id, leave_type, annual_days, used_days, remaining_days, year) VALUES (?, ?, ?, ?, ?, ?, ?)');
                    leaveEntitlements.forEach(rec => stmt.run(rec));
                    stmt.finalize();
                    console.log('✓ Leave entitlements seeded');
                }
            });
        });

        // Certifications
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='employee_certifications'", (err, row) => {
            if (!row) return;
            db.get('SELECT COUNT(*) as count FROM employee_certifications', (err, row: any) => {
                if (!err && row.count === 0) {
                    console.log('Seeding certifications...');
                    const stmt = db.prepare('INSERT INTO employee_certifications (id, employee_id, certification_name, issuing_organization, issue_date, expiry_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
                    certifications.forEach(rec => stmt.run(rec));
                    stmt.finalize();
                    console.log('✓ Certifications seeded');
                }
            });
        });
    });
};
