# Deployment

## Environment variables (`apps/api/.env`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API port (default 4000) |
| `NODE_ENV` | `production` in prod (enables secure cookies) |
| `WEB_ORIGIN` | comma-separated allowed web origins for CORS |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | **generate strong random values** (`openssl rand -hex 48`) |
| `JWT_ACCESS_TTL` | access token lifetime (default `15m`) |
| `JWT_REFRESH_TTL_DAYS` | refresh lifetime (default 7) |
| `BCRYPT_ROUNDS` | password hash cost (default 12) |
| `UPLOAD_DIR` / `MAX_UPLOAD_MB` | document storage dir / size cap |
| `SEED_DEFAULT_PASSWORD` | password for seeded demo accounts |

The web app calls the API at `/api` — put both behind one origin (reverse proxy)
in production, or set `WEB_ORIGIN` and serve the built SPA separately.

## Build & run

```bash
npm ci
npm run build                          # builds api (tsc) and web (vite)

# database
npm run db:migrate -w @pts/api         # or: npx prisma migrate deploy
npm run db:seed -w @pts/api            # first run only, if you want demo data

# start
node apps/api/dist/server.js           # API
# serve apps/web/dist as static files (nginx, a CDN, or `vite preview`)
```

## Migrations

Migrations live in `apps/api/prisma/migrations` and include the append-only
audit trigger. Use `prisma migrate deploy` in production (never `migrate dev`).
Roster eligibility can be recomputed for all operational staff via
`services/compliance.ts::evaluateAllOperational()` — wire it to a scheduled job
(e.g. nightly) so expiries flip staff to not-rosterable without an edit.

## Security checklist for production

- [ ] Replace both JWT secrets and `SEED_DEFAULT_PASSWORD`
- [ ] Serve over HTTPS (refresh cookie is `secure` when `NODE_ENV=production`)
- [ ] Restrict `WEB_ORIGIN` to your real front-end origin(s)
- [ ] Run the API behind a reverse proxy; keep `trust proxy` correct for client IPs
- [ ] Back up PostgreSQL; audit rows are append-only by design
- [ ] Point `UPLOAD_DIR` at durable storage (or swap multer for object storage)
- [ ] Review the RBAC matrix and the Finance boundary (see `docs/RBAC.md`)

## Health

`GET /api/health` returns `{ status: "ok", time }` for load-balancer checks.

## Reproducible local database

The seed is idempotent for reference data and creates demo employees/records.
`npm run db:reset` drops, re-migrates and reseeds — handy for demos.
