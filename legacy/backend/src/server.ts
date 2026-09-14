import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initializeDatabase } from './database';
import { seedDatabase } from './seed';
import { authenticateToken } from './middleware/auth';
import { auditLogger } from './middleware/auditLogger';
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import leaveRoutes from './routes/leaves';
import vehicleRoutes from './routes/vehicles';
import scheduleRoutes from './routes/schedules';
import leadRoutes from './routes/leads';
import payrollRoutes from './routes/payroll';
import leaveEntitlementsRoutes from './routes/leave_entitlements';
import vacancyRoutes from './routes/vacancies';
import candidateRoutes from './routes/candidates';
import dependentRoutes from './routes/dependents';
import employeeDocumentRoutes from './routes/employee-documents';
import employeeWarningRoutes from './routes/employee-warnings';
import attendanceRoutes from './routes/attendance';
import auditRoutes from './routes/audit';
import performanceRoutes from './routes/performance';
import trainingRoutes from './routes/training';
import disciplinaryRoutes from './routes/disciplinary';
import reportsRoutes from './routes/reports';
import aiReportsRoutes from './routes/aiReports';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5001;

// 1. PUBLIC Health check (MUST BE FIRST)
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'PTS HRMS API is running' });
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();
seedDatabase();

// 2. Authentication Routes (Public login/register)
app.use('/api/auth', authRoutes);

// 3. Protected Routes (require authentication)
app.use('/api', authenticateToken, auditLogger);
app.use('/api/employees', dependentRoutes);
app.use('/api/employees', employeeDocumentRoutes);
app.use('/api/employees', employeeWarningRoutes);
app.use('/api/employees', employeeRoutes);

app.use('/api/leaves', leaveRoutes);
app.use('/api/leave-entitlements', leaveEntitlementsRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/vacancies', vacancyRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/disciplinary', disciplinaryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai-reports', aiReportsRoutes);

// 4. Static Files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
