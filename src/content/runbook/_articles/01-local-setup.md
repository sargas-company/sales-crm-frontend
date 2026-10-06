---
title: Local setup
slug: local-setup
category: Setup
summary: One-time setup for a developer workstation — toolchain, env, docker, migrate, seed.
keywords: [local, setup, dev, install, migrate, seed]
order: 1
updatedAt: 2026-10-06
---

Target: a fresh workstation goes from `git clone` to «frontend + backend running against a seeded local DB» in under 10 minutes.

## Prerequisites

- **Node** 20+ (nvm recommended).
- **Docker Desktop** running.
- **npm** 10+.

## Steps

1. **Clone both repos** side-by-side:

   ```sh
   git clone <workspace-repo> sales-crm
   cd sales-crm
   git clone <frontend-repo> sales-crm-frontend
   git clone <backend-repo> sales-crm-backend
   ```

2. **Install deps**:

   ```sh
   cd sales-crm-frontend && npm ci
   cd ../sales-crm-backend && make setup
   ```

   `make setup` runs `npm ci`, `prisma generate`, and copies `.env.example` → `.env` if missing.

3. **Boot infrastructure**: `make local-up` from the backend repo. Spins up Postgres + Redis via docker-compose.

4. **Run migrations + seed**: `make local-migrate` then `make local-seed`.

5. **Start services**:

   ```sh
   # backend
   npm run start:dev

   # frontend
   npm run dev
   ```

6. **Login** as the seeded admin — credentials are printed in the seed script output.

## Troubleshooting

- `make local-migrate` complains about checksum drift → the migration was edited after it was applied. See «Resetting migration checksums» article.
- Backend starts but can't reach Redis → check `REDIS_PORT` in `.env` matches `docker-compose.yml`.
