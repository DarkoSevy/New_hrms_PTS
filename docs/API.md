# API reference

Base URL: `/api`. All responses are JSON `{ error: { code, message, details } }`
on failure. All routes except `/auth/*` require `Authorization: Bearer <token>`.

Conventions for list endpoints:
`?page=1&pageSize=20&sort=field:asc&q=search&<filter>=<value>` and
`?export=csv|pdf` to download instead of paginating. Responses:
`{ data, pagination: { page, pageSize, total, totalPages, hasNext, hasPrev } }`.

## Auth
| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/login` | `{ email, password }` → `{ accessToken, user }`, sets refresh cookie |
| POST | `/auth/refresh` | rotates refresh cookie → `{ accessToken }` |
| POST | `/auth/logout` | revokes current refresh token |
| GET | `/auth/me` | current identity, modules, capabilities |
| POST | `/auth/change-password` | `{ currentPassword, newPassword }` |

## Reference & meta
| GET | `/reference` | all active reference collections for forms/filters |
| GET | `/reference/meta` | current role, modules, settings |

## Employees (People)
| GET | `/employees` | scoped list; filters `departmentId,statusId,isOperational,employmentTypeId`; export |
| GET | `/employees/:id` | master record (compensation excluded) |
| POST/PUT | `/employees` `/employees/:id` | create/update (manage) |
| GET | `/employees/:id/compensation` | **HR Administrator only**; audited read |
| PUT | `/employees/:id/compensation` | HR Administrator only |
| POST/DELETE | `/employees/:id/dependents[/:depId]` | dependents |
| POST | `/employees/:id/next-of-kin` | next of kin |

## Departments / Positions / Users / Audit
| GET/POST/PUT | `/departments` `/positions` | list + admin CRUD |
| GET/POST/PUT | `/users`, `/users/:id`, `/users/:id/reset-password` | HR Administrator |
| GET | `/audit`, `/audit/entity/:type/:id` | HR Administrator; export |

## Admin configuration (HR Administrator)
`/settings/system` + per-key PUT, and CRUD collections:
`/settings/leave-types`, `/document-types`, `/training-programmes`,
`/request-types`, `/reminder-rules`, `/medical-schemes`, `/employment-types`,
`/employee-statuses`, `/shifts`.

## Dashboard
| GET | `/dashboard` | role-scoped KPIs, attendance, leave queue, watchlist, headcount, expiring |

## Contracts
| GET | `/contracts` | register with computed events, KPIs, reminder rules; export |
| POST/PUT | `/contracts` `/contracts/:id` | record/update (supersedes prior active) |

## Documents
| GET | `/documents/employee/:employeeId` | list (sensitivity-gated) |
| POST | `/documents/employee/:employeeId` | multipart upload; re-evaluates rostering |
| GET | `/documents/:id/download` | audited; blocked for restricted docs |
| DELETE | `/documents/:id` | delete; re-evaluates rostering |
| GET | `/documents/expiring` | company expiry feed |

## Hiring
| GET | `/hiring` | vacancies, funnel, candidates, driver gate labels |
| GET | `/hiring/candidates/:id` | candidate + gate state |
| POST/PUT | `/hiring/vacancies[...]` | manage vacancies |
| POST | `/hiring/candidates` | add candidate (seeds gate for operational) |
| PUT | `/hiring/candidates/:id/stage` | move stage |
| PUT | `/hiring/candidates/:id/gate/:key` | set a gate check |
| POST | `/hiring/candidates/:id/offer` | **blocked (422) until all 5 gate checks clear** for operational candidates |

## Leave
| GET | `/leave` | scoped queue; `?filter=Pending|Operations|Decided|All`; export |
| GET | `/leave/self` | own balances, history, entitlements |
| GET | `/leave/exec` | aggregate by department + cover + accrued |
| GET | `/leave/coverage` | driver cover check vs floor |
| POST | `/leave` | file a request |
| POST | `/leave/:id/decision` | `{ action: approve|reject }` — supervisor then HR, role+stage enforced |

## Attendance / Schedules
| GET/POST | `/attendance` | by date, scoped, summary, mark; export |
| GET | `/schedules` | shifts + assignments |
| POST | `/schedules/assign` | assign shift — **blocks not-rosterable operational staff** |
| DELETE | `/schedules/assign/:id` | remove assignment |

## Training
| GET | `/training` | programme compliance, blocked staff, sessions, KPIs |
| GET | `/training/self` | my certifications + rosterable status |
| POST | `/training/records` | record completion → recompute rostering |
| POST | `/training/book` | book a session |

## Requests
| GET | `/requests` | scoped queue, KPIs, catalogue; export |
| GET | `/requests/self` | my requests + catalogue |
| POST | `/requests` | raise a request |
| PUT | `/requests/:id` | status/owner/priority (HR) |

## Payroll (HR Administrator)
| GET | `/payroll` | current-period inputs, KPIs, handover totals; export |
| POST | `/payroll/inputs` | add input |
| POST | `/payroll/inputs/:id/approve` | approve |
| POST | `/payroll/periods/:id/lock` | **lock → immutable audit; sends to Finance** |

## Reports / Notifications
| GET | `/reports` | summary + role-gated export catalogue |
| GET | `/notifications` | channel feed + unread count |
| POST | `/notifications/:id/read`, `/notifications/read-all` | mark read |
