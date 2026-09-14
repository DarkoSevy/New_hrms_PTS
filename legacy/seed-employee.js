// Seed the database with a test employee
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, 'backend/database.db');
const db = new sqlite3.Database(dbPath);

console.log('Seeding database with test employee...\n');

const employeeId = 'test-emp-001';
const employeeData = {
    name: 'Test Employee',
    employeeId: 'EMP-001',
    email: 'test@pts.rw',
    department: 'Operations',
    role: 'Driver',
    status: 'Active',
    hireDate: '2024-01-01',
    phone: '+250788123456',
    avatarUrl: ''
};

db.run(`
    INSERT OR REPLACE INTO employees (
        id, name, employeeId, email, department, role, status, 
        hireDate, phone, avatarUrl
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
    employeeId,
    employeeData.name,
    employeeData.employeeId,
    employeeData.email,
    employeeData.department,
    employeeData.role,
    employeeData.status,
    employeeData.hireDate,
    employeeData.phone,
    employeeData.avatarUrl
], (err) => {
    if (err) {
        console.error('Error inserting employee:', err);
    } else {
        console.log('✓ Test employee created successfully');
        console.log('  ID:', employeeId);
        console.log('  Name:', employeeData.name);
        console.log('  Employee ID:', employeeData.employeeId);
    }
    db.close();
});
