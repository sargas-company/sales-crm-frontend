---
title: Production deploy
slug: production-deploy
category: Deploys
summary: Manual production deploy via SSH + PM2 — pre-flight, migrate, restart, verify.
keywords: [deploy, production, pm2, migrate, backup]
order: 1
updatedAt: 2026-10-06
---

Production has no automated deploy today. Every release follows this manual, auditable path.

## Pre-flight

- Fresh **backup** of the production DB, verified by restoring to a scratch instance.
- Clean `git status` on prod — no local uncommitted drift.
- You know **which commit** is going out and **which migration ids** are new.

## Steps

1. **SSH** to the production host.

2. `cd /var/www/sales-crm/sales-crm-backend`

3. **Pull** the release tag:

   ```sh
   git fetch --tags
   git checkout <release-tag>
   ```

4. **Install deps**:

   ```sh
   npm ci --omit=dev
   ```

5. **Build** the backend:

   ```sh
   npm run build
   ```

6. **Run migrations**:

   ```sh
   npx prisma migrate deploy --config=./prisma.config.ts
   ```

   Never `migrate dev` on prod. Never `db push`.

7. **Restart** the process:

   ```sh
   pm2 restart sales-crm-back-end
   pm2 logs sales-crm-back-end --lines 50 --nostream
   ```

8. **Smoke-test**: hit `/healthz` (or any public endpoint, e.g. `GET /client-requests` returning 401) and confirm the response is fast and well-formed.

## Rollback

If the smoke-test fails:

1. `pm2 stop sales-crm-back-end`
2. `git checkout <previous-tag>`
3. `npm ci --omit=dev && npm run build`
4. Restore the DB backup if migration damage is suspected.
5. `pm2 restart sales-crm-back-end`
