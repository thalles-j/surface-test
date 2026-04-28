# AGENTS.md — Surface Test

> Compact instructions for OpenCode sessions. Only repo-specific gotchas and exact commands.

## Repo Layout

Monorepo with two packages under root orchestration:

- `backend/` — Node.js + Express + Prisma (PostgreSQL). ESM (`"type": "module"`).
- `frontend/` — React 19 + Vite. ESM. Admin SPA nested at `/admin/*`.
- Root `package.json` uses `concurrently` to run both.

## Running Locally

```bash
# Install dependencies (run in both backend and frontend, or rely on CI steps)
cd backend && npm install
cd ../frontend && npm install

# Root: run both backend + frontend
npm run dev

# Run only one package
npm run dev:back   # backend only
npm run dev:front  # frontend only
```

Backend dev server: `nodemon ./src/server.js`  
Frontend dev server: `vite` (default port 5173)

## Backend — Critical Quirks

### Prisma
- **Generated client is NOT in `node_modules`**. It lives at `backend/src/generated/prisma/`.
- **Always use the custom generate script** on Windows:
  ```bash
  npm run prisma:generate        # safe wrapper that retries with --no-engine on EPERM
  npm run prisma:generate:full   # raw prisma generate
  ```
- **Database URL workaround for Windows**: `backend/src/database/prisma.js` strips `channel_binding=require` from Neon/PostgreSQL URLs when `process.platform === 'win32'`.
- **Sync workflow**: `npm run prisma:sync` = `db pull` + `prisma:generate`.

### Entry & Env
- Entry point: `backend/src/server.js`.
- Required env vars (see `backend/.env.example`):
  - `DATABASE_URL` — PostgreSQL connection string.
  - `PORT` — server port.
  - `JWT_SECRET` — token secret.
- Optional: `EMAIL_PROVIDER`, SMTP/SendGrid keys, `ALLOWED_ORIGINS` (CORS).

### Testing
- Runner: **Vitest** (`globals: true`, `environment: 'node'`).
- **All tests mock Prisma** via `backend/tests/helpers/prismaMock.js`. No real database is needed.
- Run tests:
  ```bash
  cd backend
  npm test           # vitest run (CI)
  npm run test:watch # vitest (watch)
  ```

## Frontend — Critical Quirks

### Build & Tooling
- React 19, Vite 7, React Router DOM 7.
- **Tailwind CSS v4** is installed as a devDependency AND loaded via CDN in `index.html`.
- ESLint config is flat (`eslint.config.js`).

### Routing & Auth
- Admin routes (`/admin/*`) are protected by `AdminRoute`: user must be authenticated **and** have `role === 1`.
- Checkout is guarded by `CheckoutGuard`: requires completed pre-checkout data.
- Store supports maintenance mode (backend returns 503) and early-access gating.

## CI / Quality

- **SonarCloud** workflow (`.github/workflows/sonarcloud.yml`) runs on `push` to `main` and on PRs.
- Sonar sources: `backend/src,frontend/src`.
- Exclusions: `**/node_modules/**,**/dist/**,**/build/**,**/.vite/**`.

## Code Conventions

- Backend uses Portuguese model/table names (e.g., `usuarios`, `produtos`, `pedidos`).
- Currency/Business logic assumes **BRL**.
- Admin dashboard uses a dedicated dark-theme CSS module (`adminTheme.module.css`).

## Quick Checklist Before Editing

1. If you change `prisma/schema.prisma`, run `npm run prisma:generate` (not raw `prisma generate`) on Windows.
2. Backend tests do not need a running database — they mock Prisma.
3. Frontend admin pages require `role === 1`; ensure test fixtures reflect that.
