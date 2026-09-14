import type { Express } from 'express';
import { authenticate } from '../middleware/auth.js';
import authRouter from './auth.js';
import referenceRouter from './reference.js';
import employeesRouter from './employees.js';
import departmentsRouter from './departments.js';
import positionsRouter from './positions.js';
import usersRouter from './users.js';
import auditRouter from './audit.js';
import settingsRouter from './settings.js';
import dashboardRouter from './dashboard.js';
import contractsRouter from './contracts.js';
import documentsRouter from './documents.js';
import hiringRouter from './hiring.js';
import leaveRouter from './leave.js';
import attendanceRouter from './attendance.js';
import schedulesRouter from './schedules.js';
import trainingRouter from './training.js';
import requestsRouter from './requests.js';
import payrollRouter from './payroll.js';

export function registerRoutes(app: Express) {
  app.use('/api/auth', authRouter);

  // Everything below requires authentication.
  app.use('/api/reference', authenticate, referenceRouter);
  app.use('/api/employees', authenticate, employeesRouter);
  app.use('/api/departments', authenticate, departmentsRouter);
  app.use('/api/positions', authenticate, positionsRouter);
  app.use('/api/users', authenticate, usersRouter);
  app.use('/api/audit', authenticate, auditRouter);
  app.use('/api/settings', authenticate, settingsRouter);
  app.use('/api/dashboard', authenticate, dashboardRouter);
  app.use('/api/contracts', authenticate, contractsRouter);
  app.use('/api/documents', authenticate, documentsRouter);
  app.use('/api/hiring', authenticate, hiringRouter);
  app.use('/api/leave', authenticate, leaveRouter);
  app.use('/api/attendance', authenticate, attendanceRouter);
  app.use('/api/schedules', authenticate, schedulesRouter);
  app.use('/api/training', authenticate, trainingRouter);
  app.use('/api/requests', authenticate, requestsRouter);
  app.use('/api/payroll', authenticate, payrollRouter);
}
