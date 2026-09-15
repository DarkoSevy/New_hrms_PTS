# PTS.rw HR Management System

An HR platform for **PTS.rw**, a transport & tourism company in Kigali where
roughly half the workforce are chauffeurs, drivers and mechanics on shift
rosters. Compliance — driving licence, medical fitness, defensive driving —
decides who can legally be rostered, so that logic is real and enforced, not
decoration.

Built from the design handoff (`PTS HRMS.dc.html`) to full fidelity: eight
modules across five roles, with server-side authorization, append-only audit,
and configurable policy throughout.

> **Stack decision:** the backend was (re)built on **PostgreSQL + Prisma** — the
> stack the brief named — rather than following the legacy AI-Studio SQLite
> prototype (now under [`legacy/`](./legacy)). See [`ASSUMPTIONS.md`](./ASSUMPTIONS.md)
> for the full rationale and every value I had to assume.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind v4, TanStack Query, React Router |
| Backend | Node + TypeScript + Express, Prisma ORM |
| Database | PostgreSQL 16 |
| Auth | JWT access tokens + rotating, hashed refresh tokens (httpOnly cookie) |
| Exports | CSV (native) + PDF (pdfkit) |
| Tests | Vitest + Supertest |

## Repository layout

```
apps/
  api/            Express + Prisma backend
    prisma/       schema.prisma, migrations, seed.ts
    src/
      auth/       JWT + password hashing
      rbac/       permission matrix + data scoping
      middleware/ auth, rbac, error, audit context
      lib/        prisma, audit, pagination, export, dates
      services/   compliance (roster eligibility), leave
      routes/     one router per module
      __tests__/  integration tests
  web/            React + Vite frontend
    src/
      auth/       auth context
      components/ shell, page header, UI primitives (states, modal, bell)
      pages/      one page per module
docs/             ARCHITECTURE, API, RBAC, DEPLOYMENT
legacy/           original AI-Studio prototype (reference only)
ASSUMPTIONS.md    the eleven open questions + assumptions, all configurable
```

## Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14 running locally (or a connection string)

## Setup

```bash
# 1. Install
npm install

# 2. Configure the API
cp apps/api/.env.example apps/api/.env
#   edit DATABASE_URL if your Postgres differs from the default

# 3. Create schema + seed demo data (reference data, 142 employees, demo records)
npm run db:migrate        # applies migrations (incl. append-only audit trigger)
npm run db:seed

# 4. Run both apps (API :4000, web :5173 with /api proxy)
npm run dev
```

Open http://localhost:5173.

### Demo accounts (password `Passw0rd!`)

| Role | Email |
|------|-------|
| HR Administrator | `hradmin@pts.rw` |
| HR Officer | `hrofficer@pts.rw` |
| Manager | `manager@pts.rw` |
| Employee | `employee@pts.rw` |
| Senior Management | `exec@pts.rw` |

The role comes from the session — there is **no user-facing role switcher**
(the prototype's switcher was a demo affordance only). Sign in as each account
to see the RBAC differences.

## Scripts

| Command | Effect |
|---------|--------|
| `npm run dev` | Run API + web together |
| `npm run build` | Type-check + build both apps |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed reference + demo data |
| `npm run db:reset` | Drop, migrate, reseed |
| `npm test` | Run the API integration tests |
| `npm run lint` | Type-check both apps |

## The non-negotiables, and where they live

- **Server-side authorization** — `apps/api/src/rbac/matrix.ts` (role→module) and
  `rbac/scope.ts` (department / reporting-line / self). Every route re-checks;
  the client never decides. Compensation is fetched only inside a guarded handler
  (`routes/employees.ts` → `/:id/compensation`), so restricted data never leaves
  the query layer.
- **Append-only audit** — `AuditLog` has no update/delete path in the API, and a
  database trigger (in the init migration) rejects `UPDATE`/`DELETE` outright.
  Sensitive reads (compensation, documents) and every write are recorded.
- **Configurable, not hard-coded** — leave types & entitlements, approval windows,
  training cycles, request SLAs, document types, statuses, schemes, departments,
  positions and global settings all live in tables, edited under **Admin**.
- **Server pagination / filter / sort + CSV & PDF export** on every list
  (`lib/pagination.ts`, `lib/export.ts`).
- **States** — loading skeletons, empty states, error states, form validation,
  and confirmation dialogs on destructive/irreversible actions (decline leave,
  lock payroll, delete document).

## The transport-company rules (the ones to get right)

1. **Not rosterable** — a lapsed mandatory training or an expired licence/medical
   flags an operational employee as not rosterable and notifies Operations.
   Enforced in `services/compliance.ts`, surfaced across People / Training /
   Dashboard, and it blocks shift assignment in `routes/schedules.ts`.
2. **Driver hiring gate** — no offer can be issued to an operational candidate
   until all five hiring-gate checks are recorded. Enforced in `routes/hiring.ts`
   (`POST /candidates/:id/offer`).

Both are covered by tests in `apps/api/src/__tests__/api.test.ts`.

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — system design & data model
- [`docs/API.md`](./docs/API.md) — REST endpoint reference
- [`docs/RBAC.md`](./docs/RBAC.md) — the permission matrix as implemented
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — environment & deployment
- [`ASSUMPTIONS.md`](./ASSUMPTIONS.md) — open questions & seeded defaults
