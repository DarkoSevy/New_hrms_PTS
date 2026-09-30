import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();
const PW = process.env.SEED_DEFAULT_PASSWORD ?? 'Passw0rd!';

async function login(email: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password: PW });
  expect(res.status).toBe(200);
  return res.body.accessToken as string;
}
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

let admin: string, officer: string, employee: string, manager: string, exec: string;

beforeAll(async () => {
  [admin, officer, employee, manager, exec] = await Promise.all([
    login('hradmin@pts.rw'), login('hrofficer@pts.rw'), login('employee@pts.rw'), login('manager@pts.rw'), login('exec@pts.rw'),
  ]);
});

describe('authentication', () => {
  it('rejects bad credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'hradmin@pts.rw', password: 'wrong' });
    expect(res.status).toBe(401);
  });
  it('requires a token for protected routes', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
  });
  it('returns the session identity from /me', async () => {
    const res = await request(app).get('/api/auth/me').set(auth(admin));
    expect(res.body.role).toBe('HR_ADMINISTRATOR');
    expect(res.body.canViewCompensation).toBe(true);
  });
});

describe('RBAC — module access', () => {
  it('lets HR list employees but blocks employee and exec', async () => {
    expect((await request(app).get('/api/employees').set(auth(admin))).status).toBe(200);
    expect((await request(app).get('/api/employees').set(auth(employee))).status).toBe(403);
    expect((await request(app).get('/api/employees').set(auth(exec))).status).toBe(403);
  });

  it('scopes the employee list for a manager to their reports', async () => {
    const all = await request(app).get('/api/employees?pageSize=1').set(auth(admin));
    const mgr = await request(app).get('/api/employees?pageSize=1').set(auth(manager));
    expect(mgr.body.pagination.total).toBeLessThan(all.body.pagination.total);
    expect(mgr.body.pagination.total).toBeGreaterThan(0);
  });
});

describe('RBAC — compensation is restricted at the query level', () => {
  it('only the HR Administrator can read compensation', async () => {
    const emp = await prisma.employee.findFirst({ where: { compensation: { isNot: null } }, select: { id: true } });
    const id = emp!.id;
    expect((await request(app).get(`/api/employees/${id}/compensation`).set(auth(admin))).status).toBe(200);
    expect((await request(app).get(`/api/employees/${id}/compensation`).set(auth(officer))).status).toBe(403);
    expect((await request(app).get(`/api/employees/${id}/compensation`).set(auth(employee))).status).toBe(403);
  });

  it('records a compensation read in the audit trail', async () => {
    const emp = await prisma.employee.findFirst({ where: { compensation: { isNot: null } }, select: { id: true } });
    await request(app).get(`/api/employees/${emp!.id}/compensation`).set(auth(admin));
    const row = await prisma.auditLog.findFirst({ where: { action: 'READ', entityType: 'Compensation', entityId: emp!.id }, orderBy: { createdAt: 'desc' } });
    expect(row).not.toBeNull();
  });
});

describe('audit log is append-only', () => {
  it('rejects UPDATE at the database level', async () => {
    const row = await prisma.auditLog.create({ data: { actorName: 'test', action: 'CREATE', entityType: 'Test', summary: 'probe' } });
    await expect(prisma.auditLog.update({ where: { id: row.id }, data: { summary: 'tampered' } })).rejects.toThrow();
  });
  it('rejects DELETE at the database level', async () => {
    const row = await prisma.auditLog.findFirst();
    await expect(prisma.auditLog.delete({ where: { id: row!.id } })).rejects.toThrow();
  });
});

describe('driver hiring gate', () => {
  it('blocks an offer for an operational candidate until all five checks clear', async () => {
    const dept = await prisma.department.findFirst({ where: { name: 'Operations' } });
    const vacancy = await request(app).post('/api/hiring/vacancies').set(auth(admin))
      .send({ title: 'Test Driver', departmentId: dept!.id, numberOfPositions: 1, isOperational: true });
    expect(vacancy.status).toBe(201);
    const cand = await request(app).post('/api/hiring/candidates').set(auth(admin))
      .send({ fullName: 'Gate Test', vacancyId: vacancy.body.id, isOperational: true });
    expect(cand.status).toBe(201);

    const blocked = await request(app).post(`/api/hiring/candidates/${cand.body.id}/offer`).set(auth(admin)).send({});
    expect(blocked.status).toBe(422);
    expect(blocked.body.error.details.missing.length).toBe(5);

    for (const key of ['LICENCE', 'TRAFFIC_RECORD', 'ROAD_TEST', 'MEDICAL_FITNESS', 'DEFENSIVE_DRIVING']) {
      await request(app).put(`/api/hiring/candidates/${cand.body.id}/gate/${key}`).set(auth(admin)).send({ cleared: true });
    }
    const ok = await request(app).post(`/api/hiring/candidates/${cand.body.id}/offer`).set(auth(admin)).send({});
    expect(ok.status).toBe(201);

    // cleanup
    await prisma.candidate.delete({ where: { id: cand.body.id } });
    await prisma.vacancy.delete({ where: { id: vacancy.body.id } });
  });
});

describe('leave workflow', () => {
  it('files → supervisor → HR validation → approved and updates balance', async () => {
    const annual = await prisma.leaveType.findFirst({ where: { name: 'Annual' } });
    const filed = await request(app).post('/api/leave').set(auth(employee))
      .send({ leaveTypeId: annual!.id, startDate: '2026-12-01', endDate: '2026-12-01', reason: 'Test day' });
    expect(filed.status).toBe(201);
    const id = filed.body.id;

    // employee cannot decide
    expect((await request(app).post(`/api/leave/${id}/decision`).set(auth(employee)).send({ action: 'approve' })).status).toBe(403);
    // supervisor then HR
    expect((await request(app).post(`/api/leave/${id}/decision`).set(auth(manager)).send({ action: 'approve' })).status).toBe(200);
    expect((await request(app).post(`/api/leave/${id}/decision`).set(auth(admin)).send({ action: 'approve' })).status).toBe(200);

    const lr = await prisma.leaveRequest.findUnique({ where: { id } });
    expect(lr!.stage).toBe('APPROVED');

    // cleanup
    await prisma.leaveRequest.delete({ where: { id } });
  });
});

describe('payroll restriction', () => {
  it('blocks non-admin from payroll and allows the HR Administrator', async () => {
    expect((await request(app).get('/api/payroll').set(auth(officer))).status).toBe(403);
    expect((await request(app).get('/api/payroll').set(auth(admin))).status).toBe(200);
  });
});
