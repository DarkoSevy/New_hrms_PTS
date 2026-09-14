# Architecture

## Overview

A two-app monorepo (npm workspaces):

- **`apps/api`** — stateless REST API (Express + Prisma) over PostgreSQL. Owns
  all business rules and authorization.
- **`apps/web`** — SPA (React + Vite). Renders the design; holds no authority —
  every decision is re-made server-side.

```
Browser ──HTTPS──▶ web (Vite/static)
   │  fetch /api/*  (access token in memory; refresh cookie httpOnly)
   ▼
 API (Express) ──▶ RBAC matrix + data scope ──▶ Prisma ──▶ PostgreSQL
   │                                                    └▶ AuditLog (append-only)
   └▶ services: compliance (roster eligibility), leave (balances, cover)
```

## Request lifecycle

1. `helmet`, CORS (credentialed, allow-listed origins), JSON body, cookie parser,
   `pino-http` request logging, rate-limit on auth endpoints.
2. `authenticate` verifies the Bearer access token → `req.principal`
   `{ userId, role, employeeId, fullName }`.
3. `requireModule(module, capability)` checks the RBAC matrix; denial is audited.
4. The handler applies **data scope** (`employeeScope` / `ownedRecordScope`) to
   the Prisma query, validates input with **zod**, performs the operation, and
   writes an **audit** row for sensitive reads and all writes.
5. Errors funnel through one handler that maps `AppError`, `ZodError` and Prisma
   errors to consistent `{ error: { code, message, details } }` responses.

## Authentication & sessions

- **Access token** — JWT, 15 min, carries role + employeeId. Kept in memory on
  the client (never localStorage).
- **Refresh token** — opaque 48-byte random string; only its SHA-256 hash is
  stored. Delivered as an httpOnly, SameSite=Lax cookie scoped to `/api/auth`.
- **Rotation & theft detection** — each refresh rotates the token and revokes the
  old one; reuse of an already-rotated token revokes the whole family.
- Role change or deactivation revokes all of a user's refresh tokens.

## Data model (Prisma)

Grouped domains (see `apps/api/prisma/schema.prisma`):

- **Auth/RBAC** — `User`, `RefreshToken`, `AuditLog`
- **Configurable reference** — `Department`, `Position`, `EmploymentType`,
  `EmployeeStatus`, `LeaveType`, `DocumentType`, `TrainingProgramme`,
  `RequestType`, `ContractReminderRule`, `MedicalScheme`, `Shift`, `SystemSetting`
- **Employee master** — `Employee` (self-referential manager), `Compensation`
  (restricted), `Allowance`, `Dependent`, `NextOfKin`, `MedicalEnrollment`
- **Contracts & documents** — `Contract`, `EmployeeDocument`
- **Hiring** — `Vacancy`, `Candidate`, `Interview`, `DriverGateCheck`, `Offer`,
  `OnboardingTask`
- **Leave / attendance / schedules** — `LeaveRequest`, `LeaveBalance`, `Shift`,
  `ShiftAssignment`, `Attendance`
- **Training / compliance** — `TrainingProgramme`, `TrainingSession`,
  `TrainingRecord`, `RosterEligibility`
- **Requests / payroll** — `HrRequest`, `PayrollPeriod`, `PayrollInput`
- **Notifications** — `Notification` (channel-based)

Enums are reserved for values application logic branches on and that are **not**
admin-editable (roles, workflow stages, audit actions). Everything an
administrator tunes lives in a table.

## Append-only audit

`AuditLog` is written through one service (`lib/audit.ts`) and has no update or
delete path in the API. The init migration also installs a PostgreSQL trigger
(`prevent_auditlog_mutation`) that raises on any `UPDATE`/`DELETE`, so the trail
cannot be altered even with direct database access. Each row captures actor,
role, action, entity, summary, previous/new value, IP, user-agent, timestamp.

## Compliance engine

`services/compliance.ts::evaluateRosterEligibility(employeeId)` recomputes, for an
operational employee, whether any roster-blocking document is expired/missing or
any roster-blocking training programme has lapsed. It writes `RosterEligibility`
and, on a flip to not-rosterable, creates an Operations notification. It runs on
employee edits, document upload/delete, and training completion, and is applied
as a hard block in shift assignment.

## Frontend

- **State/data** — TanStack Query for server state; auth in a React context that
  restores the session via the refresh cookie on load.
- **Design system** — tokens (colours, type scale, radii, spacing) extracted
  verbatim from the handoff into Tailwind v4 `@theme` + component classes
  (`src/index.css`). Reusable primitives cover the states the prototype omits.
- **Routing** — module routes are guarded client-side for UX; the server remains
  the authority.
