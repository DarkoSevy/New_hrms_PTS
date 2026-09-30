/**
 * PTS.rw HRMS seed.
 *
 * Every configurable value is seeded with the DESIGN PROTOTYPE value as a
 * default so the system runs end-to-end out of the box. These are plausible
 * placeholders, NOT confirmed PTS policy — see ASSUMPTIONS.md. An administrator
 * can change all of them at runtime under Settings.
 */
import {
  PrismaClient, Role, ContractKind, AppliesTo, ReminderKind, LeaveStage,
  AttendanceStatus, VacancyStage, CandidateStage, DriverGateKey, OfferStatus,
  RequestStatus, RequestPriority, PayrollInputState, PayrollPeriodStatus,
  TrainingRecordState, Prisma,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const PW = process.env.SEED_DEFAULT_PASSWORD ?? 'Passw0rd!';
const YEAR = 2026;

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
const d = (s: string) => new Date(s);
async function hash(pw: string) { return bcrypt.hash(pw, 10); }

async function main() {
  console.log('Seeding PTS HRMS…');

  // -------------------------------------------------------------------------
  // System settings (global, admin-configurable)
  // -------------------------------------------------------------------------
  const settings: Array<[string, string, string, string, string, string?]> = [
    ['driver_cover_floor', '55', 'number', 'Driver cover floor', 'Operations', 'Minimum drivers on duty per day'],
    ['annual_leave_days', '18', 'number', 'Annual leave entitlement (days)', 'Leave', 'Default annual entitlement for every employee'],
    ['carry_forward_max', '5', 'number', 'Carry-forward cap (days)', 'Leave', 'Maximum annual days carried into the next year'],
    ['carry_forward_expiry', '30 Jun', 'string', 'Carry-forward expiry', 'Leave', 'Date carried-forward days expire'],
    ['sick_certificate_threshold', '3', 'number', 'Sick certificate threshold (days)', 'Leave', 'Consecutive sick days beyond which a certificate is required'],
    ['company_name', 'PTS.rw', 'string', 'Company name', 'General'],
    ['company_location', 'Kigali', 'string', 'Primary location', 'General'],
  ];
  for (const [key, value, valueType, label, category, description] of settings) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value, label, category, description: description ?? null, valueType },
      create: { key, value, valueType, label, category, description: description ?? null },
    });
  }

  // -------------------------------------------------------------------------
  // Departments
  // -------------------------------------------------------------------------
  const deptDefs = [
    { name: 'Operations', code: 'OPS', sortOrder: 1 },
    { name: 'Sales', code: 'SAL', sortOrder: 2 },
    { name: 'Finance', code: 'FIN', sortOrder: 3 },
    { name: 'IT', code: 'IT', sortOrder: 4 },
    { name: 'Procurement', code: 'PRC', sortOrder: 5 },
    { name: 'Audit', code: 'AUD', sortOrder: 6 },
    { name: 'Legal', code: 'LEG', sortOrder: 7 },
    { name: 'Human Resources', code: 'HR', sortOrder: 8 },
    { name: 'Management', code: 'MGT', sortOrder: 9 },
  ];
  const depts: Record<string, string> = {};
  for (const dd of deptDefs) {
    const rec = await prisma.department.upsert({ where: { code: dd.code }, update: dd, create: dd });
    depts[dd.name] = rec.id;
  }

  // -------------------------------------------------------------------------
  // Positions
  // -------------------------------------------------------------------------
  const posDefs = [
    { title: 'Senior Chauffeur', code: 'OPS-SR-CHF', grade: 'OPS-4', isOperational: true, dept: 'Operations' },
    { title: 'Chauffeur (VIP desk)', code: 'OPS-VIP-CHF', grade: 'OPS-4', isOperational: true, dept: 'Operations' },
    { title: 'Driver', code: 'OPS-DRV', grade: 'OPS-3', isOperational: true, dept: 'Operations' },
    { title: 'Workshop Mechanic', code: 'OPS-MECH', grade: 'OPS-5', isOperational: true, dept: 'Operations' },
    { title: 'Fleet Supervisor', code: 'OPS-SUP', grade: 'OPS-6', isOperational: true, dept: 'Operations' },
    { title: 'Accountant', code: 'FIN-ACC', grade: 'FIN-3', isOperational: false, dept: 'Finance' },
    { title: 'Reservations Officer', code: 'SAL-RES', grade: 'SAL-2', isOperational: false, dept: 'Sales' },
    { title: 'Sales Executive', code: 'SAL-EXE', grade: 'SAL-3', isOperational: false, dept: 'Sales' },
    { title: 'IT Officer', code: 'IT-OFF', grade: 'IT-3', isOperational: false, dept: 'IT' },
    { title: 'Internal Auditor', code: 'AUD-INT', grade: 'AUD-3', isOperational: false, dept: 'Audit' },
    { title: 'Procurement Officer', code: 'PRC-OFF', grade: 'PRC-3', isOperational: false, dept: 'Procurement' },
    { title: 'Legal Counsel', code: 'LEG-CNS', grade: 'LEG-4', isOperational: false, dept: 'Legal' },
    { title: 'HR Officer', code: 'HR-OFF', grade: 'HR-3', isOperational: false, dept: 'Human Resources' },
    { title: 'HR Administrator', code: 'HR-ADM', grade: 'HR-5', isOperational: false, dept: 'Human Resources' },
    { title: 'Managing Director', code: 'MGT-MD', grade: 'EXE-1', isOperational: false, dept: 'Management' },
  ];
  const positions: Record<string, string> = {};
  for (const pd of posDefs) {
    const rec = await prisma.position.upsert({
      where: { code: pd.code },
      update: { title: pd.title, grade: pd.grade, isOperational: pd.isOperational, departmentId: depts[pd.dept] },
      create: { title: pd.title, code: pd.code, grade: pd.grade, isOperational: pd.isOperational, departmentId: depts[pd.dept] },
    });
    positions[pd.title] = rec.id;
  }

  // -------------------------------------------------------------------------
  // Employment types & statuses
  // -------------------------------------------------------------------------
  const empTypeDefs: Array<{ name: string; kind: ContractKind }> = [
    { name: 'Permanent', kind: ContractKind.PERMANENT },
    { name: 'Fixed-term', kind: ContractKind.FIXED_TERM },
    { name: 'Probation', kind: ContractKind.PROBATION },
    { name: 'Open-ended', kind: ContractKind.OPEN_ENDED },
  ];
  const empTypes: Record<string, string> = {};
  for (const t of empTypeDefs) {
    const rec = await prisma.employmentType.upsert({ where: { name: t.name }, update: t, create: t });
    empTypes[t.name] = rec.id;
  }

  const statusDefs = [
    { name: 'Active', countsAsActive: true, isTerminal: false, sortOrder: 1 },
    { name: 'On probation', countsAsActive: true, isTerminal: false, sortOrder: 2 },
    { name: 'On leave', countsAsActive: true, isTerminal: false, sortOrder: 3 },
    { name: 'Suspended', countsAsActive: false, isTerminal: false, sortOrder: 4 },
    { name: 'Terminated', countsAsActive: false, isTerminal: true, sortOrder: 5 },
  ];
  const statuses: Record<string, string> = {};
  for (const s of statusDefs) {
    const rec = await prisma.employeeStatus.upsert({ where: { name: s.name }, update: s, create: s });
    statuses[s.name] = rec.id;
  }

  // -------------------------------------------------------------------------
  // Leave types (design values as defaults)
  // -------------------------------------------------------------------------
  const leaveTypeDefs = [
    { name: 'Annual', defaultEntitlementDays: 18, entitlementLabel: '18 days', carryForwardMaxDays: 5, carryForwardExpiry: '30 Jun', appliesTo: AppliesTo.ALL, rule: 'All employees. Carry-forward max 5 days, expires 30 Jun.', requiresDocument: false, isPaid: true, requiresAdminApproval: false, requiresCertificateAfterDays: null as number | null, sortOrder: 1 },
    { name: 'Sick', defaultEntitlementDays: null, entitlementLabel: 'Per law', carryForwardMaxDays: 0, carryForwardExpiry: null, appliesTo: AppliesTo.ALL, rule: 'Certificate required beyond 3 consecutive days.', requiresDocument: true, isPaid: true, requiresAdminApproval: false, requiresCertificateAfterDays: 3, sortOrder: 2 },
    { name: 'Maternity', defaultEntitlementDays: 84, entitlementLabel: '12 weeks', carryForwardMaxDays: 0, carryForwardExpiry: null, appliesTo: AppliesTo.FEMALE, rule: '6 weeks full pay, then RSSB maternity benefit.', requiresDocument: true, isPaid: true, requiresAdminApproval: false, requiresCertificateAfterDays: null, sortOrder: 3 },
    { name: 'Paternity', defaultEntitlementDays: 4, entitlementLabel: '4 days', carryForwardMaxDays: 0, carryForwardExpiry: null, appliesTo: AppliesTo.MALE, rule: 'Within 15 days of birth.', requiresDocument: false, isPaid: true, requiresAdminApproval: false, requiresCertificateAfterDays: null, sortOrder: 4 },
    { name: 'Compassionate', defaultEntitlementDays: 3, entitlementLabel: '3 days', carryForwardMaxDays: 0, carryForwardExpiry: null, appliesTo: AppliesTo.ALL, rule: 'Immediate family. Proof required.', requiresDocument: true, isPaid: true, requiresAdminApproval: false, requiresCertificateAfterDays: null, sortOrder: 5 },
    { name: 'Unpaid', defaultEntitlementDays: null, entitlementLabel: 'Case by case', carryForwardMaxDays: 0, carryForwardExpiry: null, appliesTo: AppliesTo.ALL, rule: 'HR Administrator approval only. Deducted in payroll inputs.', requiresDocument: false, isPaid: false, requiresAdminApproval: true, requiresCertificateAfterDays: null, sortOrder: 6 },
  ];
  const leaveTypes: Record<string, string> = {};
  for (const lt of leaveTypeDefs) {
    const rec = await prisma.leaveType.upsert({ where: { name: lt.name }, update: lt, create: lt });
    leaveTypes[lt.name] = rec.id;
  }

  // -------------------------------------------------------------------------
  // Document types (compliance docs block rostering when expired)
  // -------------------------------------------------------------------------
  const docTypeDefs = [
    { name: 'Employment contract', category: 'Employment', hasExpiry: false, mandatoryForOperational: true, isSensitive: false, blocksRosterIfExpired: false, sortOrder: 1 },
    { name: 'Driving licence', category: 'Compliance', hasExpiry: true, mandatoryForOperational: true, isSensitive: false, blocksRosterIfExpired: true, sortOrder: 2 },
    { name: 'Medical fitness certificate', category: 'Compliance', hasExpiry: true, mandatoryForOperational: true, isSensitive: false, blocksRosterIfExpired: true, sortOrder: 3 },
    { name: 'Defensive driving certificate', category: 'Compliance', hasExpiry: true, mandatoryForOperational: true, isSensitive: false, blocksRosterIfExpired: true, sortOrder: 4 },
    { name: 'Academic certificates', category: 'Academic', hasExpiry: false, mandatoryForOperational: false, isSensitive: false, blocksRosterIfExpired: false, sortOrder: 5 },
    { name: 'Professional certification', category: 'Professional', hasExpiry: true, mandatoryForOperational: false, isSensitive: false, blocksRosterIfExpired: false, sortOrder: 6 },
    { name: 'Warning letter', category: 'Disciplinary', hasExpiry: false, mandatoryForOperational: false, isSensitive: true, blocksRosterIfExpired: false, sortOrder: 7 },
    { name: 'Performance review', category: 'Performance', hasExpiry: false, mandatoryForOperational: false, isSensitive: true, blocksRosterIfExpired: false, sortOrder: 8 },
  ];
  const docTypes: Record<string, string> = {};
  for (const dt of docTypeDefs) {
    const rec = await prisma.documentType.upsert({ where: { name: dt.name }, update: dt, create: dt });
    docTypes[dt.name] = rec.id;
  }

  // -------------------------------------------------------------------------
  // Training programmes (cycles configurable; some block rostering)
  // -------------------------------------------------------------------------
  const progDefs = [
    { name: 'Defensive driving', category: 'Mandatory · Operations', isMandatory: true, appliesTo: AppliesTo.OPERATIONS, cycleMonths: 24, provider: 'Rwanda National Police — road safety unit', blocksRostering: true, sortOrder: 1 },
    { name: 'First aid at the roadside', category: 'Mandatory · Operations', isMandatory: true, appliesTo: AppliesTo.OPERATIONS, cycleMonths: 24, provider: 'Rwanda Red Cross', blocksRostering: true, sortOrder: 2 },
    { name: 'VIP guest handling & protocol', category: 'Mandatory · Operations', isMandatory: true, appliesTo: AppliesTo.OPERATIONS, cycleMonths: 12, provider: 'Internal — Operations Manager', blocksRostering: false, sortOrder: 3 },
    { name: 'Vehicle inspection & pre-trip checks', category: 'Mandatory · Operations', isMandatory: true, appliesTo: AppliesTo.OPERATIONS, cycleMonths: 12, provider: 'Internal — Workshop Foreman', blocksRostering: true, sortOrder: 4 },
    { name: 'IT & data security awareness', category: 'Mandatory · All staff', isMandatory: true, appliesTo: AppliesTo.ALL, cycleMonths: 12, provider: 'Internal — IT', blocksRostering: false, sortOrder: 5 },
    { name: 'Anti-harassment & code of conduct', category: 'Mandatory · All staff', isMandatory: true, appliesTo: AppliesTo.ALL, cycleMonths: 24, provider: 'Internal — HR', blocksRostering: false, sortOrder: 6 },
    { name: 'Customer service excellence', category: 'Development', isMandatory: false, appliesTo: AppliesTo.ALL, cycleMonths: null, provider: 'Akilah Institute', blocksRostering: false, sortOrder: 7 },
    { name: 'Supervisory skills', category: 'Development', isMandatory: false, appliesTo: AppliesTo.ALL, cycleMonths: null, provider: 'Rwanda Management Institute', blocksRostering: false, sortOrder: 8 },
  ];
  const programmes: Record<string, string> = {};
  for (const pg of progDefs) {
    const rec = await prisma.trainingProgramme.upsert({ where: { name: pg.name }, update: pg, create: pg });
    programmes[pg.name] = rec.id;
  }

  // Training sessions
  const sessionDefs = [
    { prog: 'Vehicle inspection & pre-trip checks', date: `${YEAR}-09-11`, location: 'Remera yard', capacity: 20, booked: 12 },
    { prog: 'Defensive driving', date: `${YEAR}-09-18`, location: 'RNP training ground', capacity: 18, booked: 18 },
    { prog: 'VIP guest handling & protocol', date: `${YEAR}-09-25`, location: 'Head office', capacity: 15, booked: 9 },
    { prog: 'IT & data security awareness', date: `${YEAR}-09-30`, location: 'Online', capacity: 200, booked: 0 },
    { prog: 'First aid at the roadside', date: `${YEAR}-10-02`, location: 'Red Cross, Kacyiru', capacity: 16, booked: 6 },
  ];
  for (const s of sessionDefs) {
    await prisma.trainingSession.create({ data: { programmeId: programmes[s.prog], date: d(s.date), location: s.location, capacity: s.capacity, booked: s.booked } });
  }

  // -------------------------------------------------------------------------
  // Request types & SLAs
  // -------------------------------------------------------------------------
  const reqTypeDefs = [
    { name: 'Employment letter', slaDays: 3, sortOrder: 1 },
    { name: 'Salary / bank confirmation', slaDays: 3, sortOrder: 2 },
    { name: 'Document copy', slaDays: 3, sortOrder: 3 },
    { name: 'Personal data update', slaDays: 2, sortOrder: 4 },
    { name: 'Training request', slaDays: 5, sortOrder: 5 },
    { name: 'Payroll query', slaDays: 3, sortOrder: 6 },
    { name: 'Contract query', slaDays: 5, sortOrder: 7 },
    { name: 'General HR enquiry', slaDays: 5, sortOrder: 8 },
  ];
  const reqTypes: Record<string, string> = {};
  for (const rt of reqTypeDefs) {
    const rec = await prisma.requestType.upsert({ where: { name: rt.name }, update: rt, create: rt });
    reqTypes[rt.name] = rec.id;
  }

  // -------------------------------------------------------------------------
  // Contract reminder rules (60/30/7 expiry + 14 probation)
  // -------------------------------------------------------------------------
  const reminderDefs = [
    { kind: ReminderKind.CONTRACT_EXPIRY, offsetDays: 60, notifyRoles: [Role.HR_OFFICER, Role.MANAGER], action: 'Renewal decision requested', escalate: false },
    { kind: ReminderKind.CONTRACT_EXPIRY, offsetDays: 30, notifyRoles: [Role.HR_ADMINISTRATOR], action: 'Escalated if no decision recorded', escalate: true },
    { kind: ReminderKind.CONTRACT_EXPIRY, offsetDays: 7, notifyRoles: [Role.HR_ADMINISTRATOR, Role.SENIOR_MANAGEMENT], action: 'Final warning — risk of lapsed contract', escalate: true },
    { kind: ReminderKind.PROBATION_END, offsetDays: 14, notifyRoles: [Role.MANAGER], action: 'Probation review form issued', escalate: false },
  ];
  for (const r of reminderDefs) {
    await prisma.contractReminderRule.upsert({
      where: { kind_offsetDays: { kind: r.kind, offsetDays: r.offsetDays } },
      update: r, create: r,
    });
  }

  // -------------------------------------------------------------------------
  // Medical schemes (RSSB 7.5% / 7.5% split — design default)
  // -------------------------------------------------------------------------
  const scheme = await prisma.medicalScheme.upsert({
    where: { name: 'RSSB Medical Scheme' },
    update: { employeeContribPct: 7.5, employerContribPct: 7.5 },
    create: { name: 'RSSB Medical Scheme', employeeContribPct: 7.5, employerContribPct: 7.5 },
  });

  // -------------------------------------------------------------------------
  // Shifts
  // -------------------------------------------------------------------------
  const shiftDay = await prisma.shift.upsert({ where: { name: 'Day shift' }, update: {}, create: { name: 'Day shift', startTime: '07:00', endTime: '19:00' } });
  const shiftNight = await prisma.shift.upsert({ where: { name: 'Night shift' }, update: {}, create: { name: 'Night shift', startTime: '19:00', endTime: '07:00' } });
  const shiftOffice = await prisma.shift.upsert({ where: { name: 'Office hours' }, update: {}, create: { name: 'Office hours', startTime: '08:00', endTime: '17:00' } });

  console.log('Reference data seeded. Creating employees…');
  await seedEmployees({ depts, positions, empTypes, statuses, scheme, docTypes, programmes, leaveTypes, reqTypes, shiftDay, shiftNight, shiftOffice });
  console.log('Seed complete.');
}

// ---------------------------------------------------------------------------
// Employees, users, and all demo transactional data
// ---------------------------------------------------------------------------
interface SeedCtx {
  depts: Record<string, string>;
  positions: Record<string, string>;
  empTypes: Record<string, string>;
  statuses: Record<string, string>;
  scheme: { id: string };
  docTypes: Record<string, string>;
  programmes: Record<string, string>;
  leaveTypes: Record<string, string>;
  reqTypes: Record<string, string>;
  shiftDay: { id: string };
  shiftNight: { id: string };
  shiftOffice: { id: string };
}

async function seedEmployees(ctx: SeedCtx) {
  const today = new Date(`${YEAR}-09-10`);

  // The six hero records from the design (full fidelity).
  const heroes = [
    {
      code: 'PTS-0042', first: 'Jean-Paul', last: 'Habimana', gender: 'Male', dept: 'Operations', pos: 'Senior Chauffeur',
      type: 'Fixed-term', status: 'Active', ops: true, loc: 'Kigali — Remera yard', sup: 'Fleet Supervisor (day shift)',
      hired: '2021-03-04', dob: '1988-07-12', nid: '1198 8xxx xxxx xx', phone: '+250 788 xxx 214',
      basic: 480000, allowances: [{ name: 'Shift', amount: 60000 }, { name: 'Airport night', amount: 45000 }], grade: 'OPS-4',
      kin: [{ name: 'Alice Habimana', relation: 'Spouse — primary', phone: '+250 782 xxx 901', note: 'Kigali, Kicukiro', isPrimary: true }, { name: 'Emmanuel Habimana', relation: 'Brother — alternate', phone: '+250 788 xxx 445', note: 'Musanze', isPrimary: false }],
      contract: { start: '2025-10-01', end: '2026-09-22', signed: true, version: 3 },
      medical: { member: 'RSSB-4410-2277', cover: 'Employee + 4 dependents', card: 'Issued 14 Jan 2026 · valid to 31 Dec 2026', since: '01 Apr 2021', top: 'MMI top-up — none' },
      deps: [
        { name: 'Alice Habimana', relation: 'Spouse', dob: '1990-05-22', memberId: 'RSSB-4410-2277-01' },
        { name: 'Keza Habimana', relation: 'Daughter', dob: '2014-03-09', memberId: 'RSSB-4410-2277-02' },
        { name: 'Ganza Habimana', relation: 'Son', dob: '2017-11-17', memberId: 'RSSB-4410-2277-03' },
        { name: 'Iranzi Habimana', relation: 'Son', dob: '2023-02-02', memberId: 'RSSB-4410-2277-04' },
      ],
      docs: [
        { type: 'Employment contract', issue: '2025-10-01', expiry: null, version: 3 },
        { type: 'Driving licence', issue: '2022-03-14', expiry: '2027-03-14', version: 1 },
        { type: 'Medical fitness certificate', issue: '2025-11-30', expiry: '2026-11-30', version: 1 },
        { type: 'Defensive driving certificate', issue: '2026-02-02', expiry: '2028-02-02', version: 1 },
        { type: 'Warning letter', issue: '2025-06-01', expiry: null, version: 1, sensitive: true },
      ],
      training: [
        { prog: 'Defensive driving', completed: '2026-02-02', expires: '2028-02-02', state: TrainingRecordState.VALID },
        { prog: 'VIP guest handling & protocol', completed: null, expires: null, state: TrainingRecordState.BOOKED },
        { prog: 'Vehicle inspection & pre-trip checks', completed: '2026-03-14', expires: '2027-03-14', state: TrainingRecordState.VALID },
        { prog: 'First aid at the roadside', completed: '2024-07-30', expires: '2026-07-30', state: TrainingRecordState.EXPIRED },
        { prog: 'IT & data security awareness', completed: '2026-04-21', expires: '2027-04-21', state: TrainingRecordState.VALID },
      ],
      user: null as null | { email: string; role: Role },
    },
    {
      code: 'PTS-0011', first: 'Claudine', last: 'Uwase', gender: 'Female', dept: 'Finance', pos: 'Accountant',
      type: 'Permanent', status: 'Active', ops: false, loc: 'Kigali — Head office', sup: '—',
      hired: '2019-01-17', dob: '1992-02-03', nid: '1199 2xxx xxxx xx', phone: '+250 788 xxx 077',
      basic: 950000, allowances: [{ name: 'Transport', amount: 80000 }], grade: 'FIN-3',
      kin: [{ name: 'Josephine Uwase', relation: 'Mother — primary', phone: '+250 788 xxx 330', note: 'Huye', isPrimary: true }],
      contract: { start: '2019-01-17', end: null, signed: true, version: 2 },
      medical: { member: 'RSSB-1120-8891', cover: 'Employee + 1 dependent', card: 'Issued 03 Feb 2026 · valid to 31 Dec 2026', since: '01 Feb 2019', top: 'Radiant top-up — Plan B' },
      deps: [{ name: 'Shema Uwase', relation: 'Son', dob: '2021-08-11', memberId: 'RSSB-1120-8891-01' }],
      docs: [
        { type: 'Employment contract', issue: '2019-01-17', expiry: null, version: 2 },
        { type: 'Academic certificates', issue: '2015-06-01', expiry: null, version: 1 },
        { type: 'Professional certification', issue: '2024-01-01', expiry: '2026-12-31', version: 1 },
        { type: 'Performance review', issue: '2025-12-01', expiry: null, version: 1, sensitive: true },
      ],
      training: [{ prog: 'IT & data security awareness', completed: '2026-04-10', expires: '2027-04-10', state: TrainingRecordState.VALID }, { prog: 'Anti-harassment & code of conduct', completed: '2025-10-14', expires: '2027-10-14', state: TrainingRecordState.VALID }],
      user: { email: 'employee.finance@pts.rw', role: Role.EMPLOYEE },
    },
    {
      code: 'PTS-0088', first: 'Solange', last: 'Niyonsaba', gender: 'Female', dept: 'Sales', pos: 'Reservations Officer',
      type: 'Probation', status: 'On probation', ops: false, loc: 'Kigali — Head office', sup: '—',
      hired: '2026-06-16', dob: '1997-11-21', nid: '1199 7xxx xxxx xx', phone: '+250 789 xxx 512',
      basic: 420000, allowances: [{ name: 'Airtime', amount: 20000 }], grade: 'SAL-2',
      kin: [{ name: 'Pascal Niyonsaba', relation: 'Father — primary', phone: '+250 788 xxx 145', note: 'Nyagatare', isPrimary: true }],
      contract: { start: '2026-06-16', end: '2027-06-15', probationEnd: '2026-09-15', signed: true, version: 1 },
      medical: { member: 'Pending registration', cover: 'Employee only', card: 'Not issued', since: '—', top: 'None' },
      deps: [],
      docs: [{ type: 'Employment contract', issue: '2026-06-16', expiry: null, version: 1 }, { type: 'Academic certificates', issue: '2020-06-01', expiry: null, version: 1 }],
      training: [],
      user: null,
    },
    {
      code: 'PTS-0104', first: 'Eric', last: 'Nsengimana', gender: 'Male', dept: 'Operations', pos: 'Workshop Mechanic',
      type: 'Permanent', status: 'Active', ops: true, loc: 'Kigali — Remera yard', sup: 'Workshop Foreman',
      hired: '2020-09-09', dob: '1985-04-30', nid: '1198 5xxx xxxx xx', phone: '+250 788 xxx 660',
      basic: 560000, allowances: [{ name: 'Tools', amount: 30000 }], grade: 'OPS-5',
      kin: [{ name: 'Grace Nsengimana', relation: 'Spouse — primary', phone: '+250 783 xxx 118', note: 'Kigali, Gasabo', isPrimary: true }],
      contract: { start: '2020-09-09', end: null, signed: true, version: 2 },
      medical: { member: 'RSSB-1041-5533', cover: 'Employee + 3 dependents', card: 'Issued 20 Jan 2026 · valid to 31 Dec 2026', since: '01 Oct 2020', top: 'None' },
      deps: [
        { name: 'Grace Nsengimana', relation: 'Spouse', dob: '1987-06-14', memberId: 'RSSB-1041-5533-01' },
        { name: 'Divine Nsengimana', relation: 'Daughter', dob: '2011-01-30', memberId: 'RSSB-1041-5533-02' },
        { name: 'Hirwa Nsengimana', relation: 'Son', dob: '2019-12-05', memberId: 'RSSB-1041-5533-03', status: 'Card renewal due' },
      ],
      docs: [
        { type: 'Employment contract', issue: '2020-09-09', expiry: null, version: 2 },
        { type: 'Driving licence', issue: '2021-01-01', expiry: '2027-01-01', version: 1 },
        { type: 'Medical fitness certificate', issue: '2025-11-01', expiry: '2026-11-01', version: 1 },
      ],
      training: [
        { prog: 'Defensive driving', completed: '2025-08-01', expires: '2027-08-01', state: TrainingRecordState.VALID },
        { prog: 'IT & data security awareness', completed: '2025-08-15', expires: '2026-08-15', state: TrainingRecordState.OVERDUE },
        { prog: 'Vehicle inspection & pre-trip checks', completed: '2026-01-10', expires: '2027-01-10', state: TrainingRecordState.VALID },
      ],
      user: null,
    },
    {
      code: 'PTS-0129', first: 'Bosco', last: 'Mugisha', gender: 'Male', dept: 'Operations', pos: 'Chauffeur (VIP desk)',
      type: 'Fixed-term', status: 'On leave', ops: true, loc: 'Kigali — Remera yard', sup: 'Fleet Supervisor (night shift)',
      hired: '2023-02-22', dob: '1990-08-08', nid: '1199 0xxx xxxx xx', phone: '+250 787 xxx 402',
      basic: 520000, allowances: [{ name: 'Shift', amount: 60000 }], grade: 'OPS-4',
      kin: [{ name: 'Immaculée Mugisha', relation: 'Sister — primary', phone: '+250 788 xxx 771', note: 'Kigali, Nyarugenge', isPrimary: true }],
      contract: { start: '2026-03-01', end: '2027-02-28', signed: false, version: 1 },
      medical: { member: 'RSSB-1290-7742', cover: 'Employee + 2 dependents', card: 'Issued 11 Feb 2026 · valid to 31 Dec 2026', since: '01 Mar 2023', top: 'MMI top-up — none' },
      deps: [
        { name: 'Chantal Mugisha', relation: 'Spouse', dob: '1993-09-27', memberId: 'RSSB-1290-7742-01' },
        { name: 'Mucyo Mugisha', relation: 'Son', dob: '2020-04-19', memberId: 'RSSB-1290-7742-02' },
      ],
      docs: [
        { type: 'Driving licence', issue: '2021-06-01', expiry: '2027-06-01', version: 1 },
        { type: 'Medical fitness certificate', issue: '2025-10-01', expiry: '2026-10-01', version: 1 },
      ],
      training: [{ prog: 'First aid at the roadside', completed: '2024-07-30', expires: '2026-07-30', state: TrainingRecordState.EXPIRED }, { prog: 'Defensive driving', completed: '2025-05-01', expires: '2027-05-01', state: TrainingRecordState.VALID }],
      user: null,
    },
    {
      code: 'PTS-0075', first: 'Alain', last: 'Kayitare', gender: 'Male', dept: 'IT', pos: 'IT Officer',
      type: 'Fixed-term', status: 'Active', ops: false, loc: 'Kigali — Head office', sup: '—',
      hired: '2024-08-01', dob: '1994-12-14', nid: '1199 4xxx xxxx xx', phone: '+250 788 xxx 908',
      basic: 780000, allowances: [{ name: 'Standby', amount: 50000 }], grade: 'IT-3',
      kin: [{ name: 'Nadine Kayitare', relation: 'Spouse — primary', phone: '+250 788 xxx 233', note: 'Kigali, Gasabo', isPrimary: true }],
      contract: { start: '2025-10-01', end: '2026-10-01', signed: true, version: 2 },
      medical: { member: 'RSSB-0751-3308', cover: 'Employee + 2 dependents', card: 'Issued 28 Jan 2026 · valid to 31 Dec 2026', since: '01 Sep 2024', top: 'Britam top-up — Plan A' },
      deps: [
        { name: 'Nadine Kayitare', relation: 'Spouse', dob: '1996-03-02', memberId: 'RSSB-0751-3308-01' },
        { name: 'Ineza Kayitare', relation: 'Daughter', dob: '2024-07-23', memberId: 'RSSB-0751-3308-02' },
      ],
      docs: [{ type: 'Employment contract', issue: '2025-10-01', expiry: null, version: 2 }, { type: 'Professional certification', issue: '2024-01-01', expiry: '2026-12-31', version: 1 }],
      training: [{ prog: 'IT & data security awareness', completed: '2026-04-21', expires: '2027-04-21', state: TrainingRecordState.VALID }],
      user: null,
    },
  ];

  const codeToId: Record<string, string> = {};
  for (const h of heroes) {
    const emp = await prisma.employee.create({
      data: {
        employeeCode: h.code,
        firstName: h.first,
        lastName: h.last,
        fullName: `${h.first} ${h.last}`,
        initials: initials(`${h.first} ${h.last}`),
        gender: h.gender,
        dateOfBirth: d(h.dob),
        nationalId: h.nid,
        nationality: 'Rwandan',
        phone: h.phone,
        address: 'Kigali, Gasabo',
        workLocation: h.loc,
        departmentId: ctx.depts[h.dept],
        positionId: ctx.positions[h.pos],
        employmentTypeId: ctx.empTypes[h.type],
        statusId: ctx.statuses[h.status],
        isOperational: h.ops,
        operationalSupervisor: h.sup,
        hireDate: d(h.hired),
        emergencyContactName: h.kin[0]?.name,
        emergencyContactPhone: h.kin[0]?.phone,
        emergencyContactRelation: h.kin[0]?.relation,
        compensation: { create: { basicSalary: new Prisma.Decimal(h.basic), grade: h.grade, effectiveFrom: d(`${YEAR}-01-01`), lastRevision: '+8% on 01 Jan 2026', payrollStatus: 'Included, September run' } },
        allowances: { create: h.allowances.map((a) => ({ name: a.name, amount: new Prisma.Decimal(a.amount) })) },
        nextOfKin: { create: h.kin },
        dependents: { create: h.deps.map((dep) => ({ name: dep.name, relation: dep.relation, dateOfBirth: d(dep.dob), memberId: dep.memberId, status: (dep as { status?: string }).status ?? 'Active' })) },
        medicalEnrollment: { create: { schemeId: ctx.scheme.id, memberNumber: h.medical.member, coverDescription: h.medical.cover, cardIssued: h.medical.card, cardValidTo: '31 Dec 2026', enrolledSince: h.medical.since, topUp: h.medical.top } },
      },
    });
    codeToId[h.code] = emp.id;

    // Contract
    await prisma.contract.create({
      data: {
        employeeId: emp.id,
        kind: h.type === 'Fixed-term' ? ContractKind.FIXED_TERM : h.type === 'Probation' ? ContractKind.PROBATION : h.type === 'Permanent' ? ContractKind.PERMANENT : ContractKind.OPEN_ENDED,
        startDate: d(h.contract.start),
        endDate: h.contract.end ? d(h.contract.end) : null,
        probationEndDate: (h.contract as { probationEnd?: string }).probationEnd ? d((h.contract as { probationEnd?: string }).probationEnd!) : null,
        version: h.contract.version,
        signedCopyOnFile: h.contract.signed,
      },
    });

    // Documents
    for (const doc of h.docs) {
      await prisma.employeeDocument.create({
        data: {
          employeeId: emp.id,
          documentTypeId: ctx.docTypes[doc.type],
          fileName: `${doc.type.toLowerCase().replace(/\s+/g, '-')}-${h.code}.pdf`,
          filePath: `seed://${h.code}/${doc.type}`,
          issueDate: doc.issue ? d(doc.issue) : null,
          expiryDate: doc.expiry ? d(doc.expiry) : null,
          version: doc.version,
          isSensitive: (doc as { sensitive?: boolean }).sensitive ?? false,
        },
      });
    }

    // Training records
    for (const tr of h.training) {
      await prisma.trainingRecord.create({
        data: {
          employeeId: emp.id,
          programmeId: ctx.programmes[tr.prog],
          completedAt: tr.completed ? d(tr.completed) : null,
          expiresAt: tr.expires ? d(tr.expires) : null,
          state: tr.state,
        },
      });
    }

    // Leave balance (annual)
    await prisma.leaveBalance.create({ data: { employeeId: emp.id, leaveTypeId: ctx.leaveTypes['Annual'], year: YEAR, entitlement: 18, taken: h.code === 'PTS-0042' ? 11 : 3, pending: h.code === 'PTS-0042' ? 4 : 0 } });
  }

  // Users for each role (login accounts). HR Admin/Officer/Manager/Exec are staff
  // accounts; the Employee demo account is Jean-Paul.
  const users: Array<{ email: string; role: Role; name: string; employeeCode?: string }> = [
    { email: 'hradmin@pts.rw', role: Role.HR_ADMINISTRATOR, name: 'Aline Mukamana' },
    { email: 'hrofficer@pts.rw', role: Role.HR_OFFICER, name: 'Aline Mutoni' },
    { email: 'manager@pts.rw', role: Role.MANAGER, name: 'Eric Nsengimana', employeeCode: 'PTS-0104' },
    { email: 'employee@pts.rw', role: Role.EMPLOYEE, name: 'Jean-Paul Habimana', employeeCode: 'PTS-0042' },
    { email: 'exec@pts.rw', role: Role.SENIOR_MANAGEMENT, name: 'Yves Mugabo' },
  ];
  const pwHash = await hash(PW);
  const userByRole: Record<string, string> = {};
  for (const u of users) {
    const rec = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: pwHash,
        role: u.role,
        fullName: u.name,
        initials: initials(u.name),
        employeeId: u.employeeCode ? codeToId[u.employeeCode] : null,
      },
    });
    userByRole[u.role] = rec.id;
  }

  // Make Jean-Paul & Bosco report to the manager (Eric) for scoping demos.
  await prisma.employee.updateMany({ where: { employeeCode: { in: ['PTS-0042', 'PTS-0129'] } }, data: { directManagerId: codeToId['PTS-0104'] } });

  // Filler employees to reach realistic department headcounts for dashboards.
  await seedFiller(ctx, codeToId);

  // Transactional demo data
  await seedLeave(ctx, codeToId);
  await seedHiring(ctx);
  await seedRequests(ctx, codeToId, userByRole);
  await seedPayroll(ctx, codeToId, userByRole);
  await seedAttendance(ctx, codeToId);

  // Evaluate roster eligibility for all operational staff.
  const { evaluateAllOperational } = await import('../src/services/compliance.js');
  const n = await evaluateAllOperational();
  console.log(`Roster eligibility evaluated for ${n} operational staff.`);
}

const FIRST = ['Aline', 'Eric', 'Diane', 'Patrick', 'Jean', 'Marie', 'Paul', 'Grace', 'Yves', 'Chantal', 'Fabrice', 'Innocent', 'Claude', 'Josiane', 'Emmanuel', 'Sandrine', 'Olivier', 'Nadege', 'Thierry', 'Vestine'];
const LAST = ['Habimana', 'Uwase', 'Niyonsaba', 'Nsengimana', 'Mugisha', 'Kayitare', 'Mukamana', 'Rugema', 'Ingabire', 'Bizimana', 'Nkurunziza', 'Umutoni', 'Mugabo', 'Uwimana', 'Twagirayezu', 'Iradukunda'];

async function seedFiller(ctx: SeedCtx, codeToId: Record<string, string>) {
  // Target counts per department (design values). Heroes already fill some.
  const targets: Array<{ dept: string; pos: string; ops: boolean; count: number }> = [
    { dept: 'Operations', pos: 'Driver', ops: true, count: 55 },
    { dept: 'Operations', pos: 'Workshop Mechanic', ops: true, count: 12 },
    { dept: 'Operations', pos: 'Fleet Supervisor', ops: true, count: 5 },
    { dept: 'Sales', pos: 'Sales Executive', ops: false, count: 16 },
    { dept: 'Finance', pos: 'Accountant', ops: false, count: 11 },
    { dept: 'IT', pos: 'IT Officer', ops: false, count: 8 },
    { dept: 'Procurement', pos: 'Procurement Officer', ops: false, count: 8 },
    { dept: 'Audit', pos: 'Internal Auditor', ops: false, count: 5 },
    { dept: 'Legal', pos: 'Legal Counsel', ops: false, count: 4 },
    { dept: 'Human Resources', pos: 'HR Officer', ops: false, count: 8 },
    { dept: 'Management', pos: 'Managing Director', ops: false, count: 4 },
  ];
  let seq = 200;
  const empType = ctx.empTypes['Permanent'];
  const statusActive = ctx.statuses['Active'];
  const rows: Prisma.EmployeeCreateManyInput[] = [];
  for (const t of targets) {
    for (let i = 0; i < t.count; i++) {
      seq++;
      const first = FIRST[seq % FIRST.length];
      const last = LAST[(seq * 7) % LAST.length];
      rows.push({
        employeeCode: `PTS-${String(seq).padStart(4, '0')}`,
        firstName: first,
        lastName: last,
        fullName: `${first} ${last}`,
        initials: initials(`${first} ${last}`),
        gender: seq % 2 === 0 ? 'Male' : 'Female',
        nationality: 'Rwandan',
        workLocation: t.ops ? 'Kigali — Remera yard' : 'Kigali — Head office',
        departmentId: ctx.depts[t.dept],
        positionId: ctx.positions[t.pos],
        employmentTypeId: empType,
        statusId: statusActive,
        isOperational: t.ops,
        hireDate: new Date(`${2018 + (seq % 8)}-0${1 + (seq % 9)}-15`),
      });
    }
  }
  await prisma.employee.createMany({ data: rows, skipDuplicates: true });

  // Give operational filler the full set of compliance docs + blocking training so
  // they are rosterable (only the design's flagged heroes stay not-rosterable).
  const validFrom = new Date(`${YEAR - 1}-01-01`);
  const validTo = new Date(`${YEAR + 2}-01-01`);
  const blockingDocs = ['Driving licence', 'Medical fitness certificate', 'Defensive driving certificate'];
  const blockingProgs = ['Defensive driving', 'First aid at the roadside', 'Vehicle inspection & pre-trip checks'];
  const opsFiller = await prisma.employee.findMany({ where: { isOperational: true, compensation: null }, select: { id: true } });
  for (const e of opsFiller) {
    await prisma.employeeDocument.createMany({
      data: blockingDocs.map((name) => ({ employeeId: e.id, documentTypeId: ctx.docTypes[name], fileName: `${name}.pdf`, filePath: `seed://${name}`, issueDate: validFrom, expiryDate: validTo, version: 1 })),
    });
    await prisma.trainingRecord.createMany({
      data: blockingProgs.map((name) => ({ employeeId: e.id, programmeId: ctx.programmes[name], completedAt: validFrom, expiresAt: validTo, state: TrainingRecordState.VALID })),
      skipDuplicates: true,
    });
  }
  const allEmp = await prisma.employee.findMany({ select: { id: true } });
  await prisma.leaveBalance.createMany({
    data: allEmp
      .filter((e) => ![codeToId['PTS-0042'], codeToId['PTS-0011'], codeToId['PTS-0088'], codeToId['PTS-0104'], codeToId['PTS-0129'], codeToId['PTS-0075']].includes(e.id))
      .map((e) => ({ employeeId: e.id, leaveTypeId: ctx.leaveTypes['Annual'], year: YEAR, entitlement: 18, taken: 6, pending: 0 })),
    skipDuplicates: true,
  });
}

async function seedLeave(ctx: SeedCtx, codeToId: Record<string, string>) {
  const rows = [
    { ref: 'LV-2026-0311', code: 'PTS-0042', type: 'Annual', start: '2026-09-14', end: '2026-09-17', days: 4, stage: LeaveStage.SUPERVISOR, reason: 'Family time during a quieter rotation.', cover: 'Bosco Mugisha covering VIP desk' },
    { ref: 'LV-2026-0312', code: 'PTS-0011', type: 'Sick', start: '2026-09-11', end: '2026-09-12', days: 2, stage: LeaveStage.HR_VALIDATION, reason: 'Illness — medical certificate attached.', cover: 'Month-end tasks reassigned', doc: 'Medical certificate — Kibagabaga Hospital' },
    { ref: 'LV-2026-0313', code: 'PTS-0104', type: 'Annual', start: '2026-09-22', end: '2026-09-29', days: 6, stage: LeaveStage.SUPERVISOR, reason: 'Annual leave.', cover: 'Workshop foreman to reassign service slots' },
    { ref: 'LV-2026-0309', code: 'PTS-0129', type: 'Unpaid', start: '2026-09-15', end: '2026-09-15', days: 1, stage: LeaveStage.REJECTED, reason: 'Personal errand.', cover: 'No cover available' },
    { ref: 'LV-2026-0308', code: 'PTS-0075', type: 'Annual', start: '2026-09-08', end: '2026-09-10', days: 3, stage: LeaveStage.APPROVED, reason: 'Annual leave.', cover: 'Standby rota adjusted' },
  ];
  for (const r of rows) {
    await prisma.leaveRequest.create({
      data: {
        reference: r.ref, employeeId: codeToId[r.code], leaveTypeId: ctx.leaveTypes[r.type],
        startDate: d(r.start), endDate: d(r.end), days: r.days, reason: r.reason, stage: r.stage,
        coverNote: r.cover, filedAt: d('2026-09-08'),
        hrDecisionAt: r.stage === LeaveStage.APPROVED ? d('2026-09-05') : null,
      },
    });
  }
}

async function seedHiring(ctx: SeedCtx) {
  const vacDefs = [
    { title: 'Chauffeur (VIP desk)', dept: 'Operations', pos: 'Chauffeur (VIP desk)', n: 3, ops: true, stage: VacancyStage.INTERVIEWING },
    { title: 'Workshop Mechanic', dept: 'Operations', pos: 'Workshop Mechanic', n: 1, ops: true, stage: VacancyStage.SCREENING },
    { title: 'Reservations Officer', dept: 'Sales', pos: 'Reservations Officer', n: 1, ops: false, stage: VacancyStage.OFFER_OUT },
    { title: 'Internal Auditor', dept: 'Audit', pos: 'Internal Auditor', n: 1, ops: false, stage: VacancyStage.APPROVED },
  ];
  const vacIds: Record<string, string> = {};
  for (const v of vacDefs) {
    const rec = await prisma.vacancy.create({ data: { title: v.title, departmentId: ctx.depts[v.dept], positionId: ctx.positions[v.pos], numberOfPositions: v.n, isOperational: v.ops, stage: v.stage } });
    vacIds[v.title] = rec.id;
  }
  const candDefs = [
    { name: 'Innocent Bizimana', vac: 'Chauffeur (VIP desk)', stage: CandidateStage.ROAD_TEST, ops: true, note: '12 years, category B and D · clean record' },
    { name: 'Chantal Ingabire', vac: 'Reservations Officer', stage: CandidateStage.OFFER_OUT, ops: false, note: 'Offer sent 08 Sep · awaiting signature' },
    { name: 'Fabrice Nkurunziza', vac: 'Workshop Mechanic', stage: CandidateStage.SCREENING, ops: true, note: 'Hybrid diagnostics certified' },
    { name: 'Aline Mukandayisenga', vac: 'Internal Auditor', stage: CandidateStage.INTERVIEW, ops: false, note: 'CPA Part III · 6 years audit' },
  ];
  for (const c of candDefs) {
    const cand = await prisma.candidate.create({ data: { fullName: c.name, initials: initials(c.name), vacancyId: vacIds[c.vac], stage: c.stage, isOperational: c.ops, notes: c.note } });
    if (c.ops) {
      // Seed the five gate checks; road-test candidate has some cleared, some pending.
      const cleared: Record<DriverGateKey, boolean> = {
        LICENCE: true, TRAFFIC_RECORD: c.stage !== CandidateStage.SCREENING, ROAD_TEST: false, MEDICAL_FITNESS: false, DEFENSIVE_DRIVING: false,
      };
      for (const key of Object.values(DriverGateKey)) {
        await prisma.driverGateCheck.create({ data: { candidateId: cand.id, checkKey: key, cleared: cleared[key], clearedAt: cleared[key] ? new Date() : null } });
      }
    }
    if (c.stage === CandidateStage.OFFER_OUT) {
      await prisma.offer.create({ data: { candidateId: cand.id, status: OfferStatus.ISSUED, issuedAt: d('2026-09-08'), expiresAt: d('2026-09-15') } });
    }
  }
}

async function seedRequests(ctx: SeedCtx, codeToId: Record<string, string>, userByRole: Record<string, string>) {
  const owner = userByRole[Role.HR_OFFICER];
  const admin = userByRole[Role.HR_ADMINISTRATOR];
  const rows = [
    { ref: 'HR-2026-0442', code: 'PTS-0042', type: 'Employment letter', pri: RequestPriority.NORMAL, status: RequestStatus.IN_PROGRESS, owner, detail: 'Bank loan application — needs salary confirmation letter addressed to Bank of Kigali.', age: 2 },
    { ref: 'HR-2026-0441', code: 'PTS-0011', type: 'Personal data update', pri: RequestPriority.HIGH, status: RequestStatus.AWAITING_EMPLOYEE, owner, detail: 'Change of bank account for salary payment. Requires ID verification before payroll cut-off.', age: 3 },
    { ref: 'HR-2026-0439', code: 'PTS-0104', type: 'Training request', pri: RequestPriority.NORMAL, status: RequestStatus.PENDING_MANAGER, owner: null, detail: 'Requests enrolment in hybrid-vehicle diagnostics course ahead of new fleet arrival.', age: 5 },
    { ref: 'HR-2026-0437', code: 'PTS-0088', type: 'Contract query', pri: RequestPriority.LOW, status: RequestStatus.IN_PROGRESS, owner: admin, detail: 'Asks when probation confirmation letter will be issued. Probation ends 15 Jun 2027.', age: 6 },
    { ref: 'HR-2026-0433', code: 'PTS-0129', type: 'Document copy', pri: RequestPriority.HIGH, status: RequestStatus.OVERDUE, owner, detail: 'Copy of signed contract and RSSB medical card for visa application.', age: 9 },
    { ref: 'HR-2026-0428', code: 'PTS-0075', type: 'Payroll query', pri: RequestPriority.NORMAL, status: RequestStatus.RESOLVED, owner: admin, detail: 'Standby allowance missing from August payslip. Referred to Finance with approved payroll input.', age: 14 },
  ];
  for (const r of rows) {
    const rt = await prisma.requestType.findUnique({ where: { name: r.type } });
    await prisma.hrRequest.create({
      data: {
        reference: r.ref, employeeId: codeToId[r.code], requestTypeId: reqTypeId(ctx, r.type), category: r.type,
        detail: r.detail, priority: r.pri, status: r.status, ownerId: r.owner, slaDays: rt?.slaDays ?? 3,
        raisedAt: new Date(Date.now() - r.age * 86400000),
        resolvedAt: r.status === RequestStatus.RESOLVED ? new Date(Date.now() - 86400000) : null,
      },
    });
  }
}
function reqTypeId(ctx: SeedCtx, name: string): string { return ctx.reqTypes[name]; }

async function seedPayroll(ctx: SeedCtx, codeToId: Record<string, string>, userByRole: Record<string, string>) {
  const admin = userByRole[Role.HR_ADMINISTRATOR];
  const period = await prisma.payrollPeriod.create({ data: { month: 9, year: YEAR, status: PayrollPeriodStatus.OPEN, cutoffDate: d('2026-09-22') } });
  const inputs = [
    { code: 'PTS-0042', item: 'Night airport allowance', amount: 45000, deduction: false, basis: '9 night transfers, Aug rota', state: PayrollInputState.APPROVED },
    { code: 'PTS-0104', item: 'Overtime, 14 hours', amount: 62300, deduction: false, basis: 'Week 36 workshop backlog', state: PayrollInputState.PENDING_HR },
    { code: 'PTS-0129', item: 'Unpaid leave, 1 day', amount: 18400, deduction: true, basis: 'LV-2026-0309 declined, absent anyway', state: PayrollInputState.PENDING_HR },
    { code: 'PTS-0075', item: 'Standby allowance, backdated', amount: 50000, deduction: false, basis: 'HR-2026-0428 — missing from Aug', state: PayrollInputState.APPROVED },
    { code: 'PTS-0011', item: 'Bank account change', amount: 0, deduction: false, basis: 'Awaiting ID verification', state: PayrollInputState.BLOCKED, noValue: true },
  ];
  for (const i of inputs) {
    await prisma.payrollInput.create({
      data: {
        periodId: period.id, employeeId: codeToId[i.code], item: i.item, amount: new Prisma.Decimal(i.amount),
        isDeduction: i.deduction, isValueChange: !(i as { noValue?: boolean }).noValue, basis: i.basis, state: i.state,
        approvedById: i.state === PayrollInputState.APPROVED ? admin : null,
        approvedAt: i.state === PayrollInputState.APPROVED ? new Date() : null,
      },
    });
  }
}

async function seedAttendance(ctx: SeedCtx, codeToId: Record<string, string>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const all = await prisma.employee.findMany({ select: { id: true, isOperational: true, statusId: true } });
  const onLeaveStatus = await prisma.employeeStatus.findUnique({ where: { name: 'On leave' } });
  const data: Prisma.AttendanceCreateManyInput[] = all.map((e, idx) => {
    let status: AttendanceStatus = AttendanceStatus.ON_DUTY;
    if (e.statusId === onLeaveStatus?.id) status = AttendanceStatus.ON_LEAVE;
    else if (idx % 13 === 0) status = AttendanceStatus.ON_LEAVE;
    else if (idx % 17 === 0) status = AttendanceStatus.UNEXPLAINED;
    return { employeeId: e.id, date: today, status, checkIn: status === AttendanceStatus.ON_DUTY ? '07:45' : null };
  });
  await prisma.attendance.createMany({ data, skipDuplicates: true });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
