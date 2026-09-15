# RBAC — permission matrix as implemented

Authorization is enforced **on the server** for every request. The role and
identity come only from the verified JWT (`middleware/auth.ts`); nothing in the
client — header, body, query — can change them. There is no role switcher in
production.

Two layers combine:

1. **Module × capability** — `apps/api/src/rbac/matrix.ts`
2. **Data scope** (which rows) — `apps/api/src/rbac/scope.ts`

## 1. Module × capability

`view` = may open the module / read its lists. `manage` = may create/update/act.

| Module | HR Administrator | HR Officer | Manager | Employee | Senior Management |
|--------|:---:|:---:|:---:|:---:|:---:|
| Dashboard | view | view | view | view | view |
| People | manage | manage | view | — | — |
| Leave | manage | manage | manage | manage¹ | view² |
| Contracts | manage | manage | — | — | view² |
| Hiring | manage | manage | — | — | view² |
| Training | manage | manage | view | view¹ | view² |
| Requests | manage | manage | view | manage¹ | — |
| Payroll | manage | — | — | — | — |
| Attendance | manage | manage | view | — | — |
| Schedules | manage | manage | manage | — | — |
| Reports | manage | view | view | — | view |
| Admin (config) | manage | — | — | — | — |
| Audit | view | — | — | — | — |

¹ Employee "manage" on Leave/Requests means acting on **their own** records only
  (file leave, raise a request) — never deciding others'.
² Senior Management is **aggregate-only**: it reads roll-ups (leave by
  department, contract risk, hiring status, training compliance) and never
  individual records.

The nav bar is built from `visibleModules(role)`; the same matrix gates each API
route via `requireModule(module, capability)`. A denied attempt writes an
`ACCESS_DENIED` audit row before returning 403.

## 2. Data scope

Applied to every employee-scoped query as a Prisma `where` fragment:

| Role | Employee records visible |
|------|--------------------------|
| HR Administrator / HR Officer | all employees |
| Manager | self + direct reports (reporting line: `directManagerId`) |
| Employee | self only |
| Senior Management | none individually — aggregate endpoints only |

The same scope is reused for owned child records (leave, requests, attendance,
schedules, dashboard leave queue) via `ownedRecordScope`.

## 3. Record-sensitivity rules

- **Compensation / salary** — readable only by the HR Administrator
  (`canViewCompensation`). The `Compensation` row is queried exclusively inside
  the guarded `/employees/:id/compensation` handler; it is never inlined into the
  employee detail payload. Every read is audited.
- **Payroll inputs** — HR Administrator only (matrix `payroll`). Others get 403 →
  the client renders the "restricted module" state.
- **Sensitive documents** (warning letters, performance reviews) — hidden from
  managers and self; visible to HR. Download re-checks and audits.

## Finance boundary (open question)

The design's five roles do not include a distinct **Finance** role, yet the
payroll/compensation copy says "HR Administrator and Finance". I mapped
payroll + compensation to **HR Administrator only** (matching the prototype's
`canSeePay`). To add Finance, add the role to the `Role` enum and grant it
`payroll` view/manage in `matrix.ts` plus compensation read in
`canViewCompensation`. See `ASSUMPTIONS.md`.
