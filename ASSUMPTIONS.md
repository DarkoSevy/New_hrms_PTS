# Assumptions & open questions

You told me the README's eleven open questions carry *plausible placeholders, not
PTS policy*, and asked me to build each one **configurable with the prototype
value as a seeded default** and to **list back everything I had to assume**. This
is that list.

Every value below is:

- **seeded** as the default (from the design reference), and
- **editable at runtime** by an HR Administrator under **Admin → Configuration**
  (system settings) or the relevant reference collection — nothing here is
  hard-coded in application logic.

Please confirm or correct each. Changing them is a data edit, not a code change.

## The eleven open questions

| # | Question | Seeded default | Where to change |
|---|----------|----------------|-----------------|
| 1 | Annual leave carry-forward | Max **5 days**, expire **30 Jun** | Admin → System settings (`carry_forward_max`, `carry_forward_expiry`) and per leave type |
| 2 | Paternity entitlement | **4 days**, within 15 days of birth | Admin → Leave types → Paternity |
| 3 | Compassionate entitlement | **3 days**, immediate family, proof required | Admin → Leave types → Compassionate |
| 4 | Sick-leave certificate threshold | Certificate required beyond **3 consecutive days** | Admin → System settings (`sick_certificate_threshold`) + Leave type |
| 5 | Driver cover floor | Minimum **55 drivers** on duty per day | Admin → System settings (`driver_cover_floor`) |
| 6 | Training renewal cycles | Defensive driving **24m**, First aid **24m**, VIP protocol **12m**, Pre-trip checks **12m**, IT security **12m**, Code of conduct **24m** | Admin → Training programmes |
| 7 | Request SLAs | Employment letter 3d, Salary/bank confirmation 3d, Document copy 3d, Personal data update 2d, Training request 5d, Payroll query 3d, Contract query 5d, General enquiry 5d | Admin → Request types |
| 8 | Contract reminder windows | **60 / 30 / 7** days before expiry; **14** days before probation end | Admin → Contract reminder windows |
| 9 | Medical scheme & contribution split | **RSSB Medical Scheme**, employee **7.5%** / employer **7.5%** | Admin → Medical schemes |
| 10 | Headcount figures | **142** employees seeded across 9 departments (design cited "148 active · 7 departments"; see note) | Seed / People module |
| 11 | Salary data | Seeded per the six hero records; all other employees have no compensation row until entered | People → Compensation (HR Administrator only) |

## Other assumptions I had to make

1. **The README (written spec) never reached me.** The uploaded zip was empty and
   the local Windows paths were unreachable; only `PTS HRMS.dc.html` arrived. I
   reconstructed the specification (RBAC table, colours, type scale, radii,
   spacing, business rules, seed data) **from the design reference's embedded
   code**, which contained all of it. If the README states anything the design
   file did not, I have not seen it.

2. **Stack.** You said "choose for me." I built the backend on **PostgreSQL +
   Prisma** (your named stack) rather than following the legacy prototype's
   SQLite + raw SQL, because the non-negotiables (query-level compensation
   restriction, append-only audit, configurable reference data, migrations) are
   materially safer on it. The legacy prototype is preserved under `legacy/`.
   The Gemini/`@google/genai` dependency was dropped (no AI feature in the design).

3. **The Finance role boundary (open question #10 in your list).** The design's
   five roles are HR Administrator, HR Officer, Manager, Employee, Senior
   Management — there is **no distinct Finance role**. The prototype grants
   payroll inputs and compensation to the **HR Administrator only** (`canSeePay`).
   I implemented exactly that. If Finance is a real role that should see payroll
   inputs/compensation, tell me and I'll add it to the RBAC matrix (it is one
   entry in `apps/api/src/rbac/matrix.ts`).

4. **Headcount.** The design cites "148 active · 7 departments" on the dashboard
   but its department breakdown sums to ~130, and the People filter says
   "Operations 74 · Office 74 = 148". I seeded **142** employees (6 detailed hero
   records + generated filler) across **9** departments (the 7 named + HR +
   Management, which the role/reporting model needs). Dashboards compute from real
   rows, so figures reflect seeded data, not the literal "148". Give me the real
   org structure and I'll reseed.

5. **Authentication.** JWT access tokens (15 min) + rotating, hashed refresh
   tokens in an httpOnly cookie, with reuse detection. Demo accounts all use
   password `Passw0rd!`. Change `SEED_DEFAULT_PASSWORD` and rotate JWT secrets for
   any real deployment.

6. **Leave approval flow.** Implemented as the design states: employee request →
   supervisor → HR validation. "Supervisor" = the employee's `directManager`.
   Managers see only their direct reports (reporting-line scope).

7. **Roster eligibility rule.** An operational employee is not-rosterable if any
   document type flagged *blocks roster if expired* (driving licence, medical
   fitness, defensive driving cert) is expired/missing, OR any training programme
   flagged *blocks rostering* has lapsed. Which documents/programmes block is
   configurable. Non-operational staff are never gated by this rule.

8. **Driver hiring gate.** The five checks from the design are enforced: no offer
   can be created for an operational candidate until all five are cleared. The
   check definitions are fixed in code (they are named in the design); their
   cleared/not-cleared state is data.

9. **Payroll scope.** This is the **HR input layer, not a payroll engine** (per the
   design). It records approved allowances/overtime/unpaid/deductions and hands
   Finance a signed-off set. Tax, RSSB contributions and payslips are out of scope.

10. **Currency & locale.** RWF, `en-GB` date formatting, Kigali. Adjustable.
