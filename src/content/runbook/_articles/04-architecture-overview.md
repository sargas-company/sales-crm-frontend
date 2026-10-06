---
title: Architecture overview
slug: architecture-overview
category: Architecture
summary: Three repos, how data flows between the frontend, backend, Postgres, Redis, and the Scanner Core worker.
keywords: [architecture, overview, stack, nestjs, react, prisma, bullmq, redis]
order: 1
updatedAt: 2026-10-06
---

Sargas CRM is a **permanent internal agency tool** — not a SaaS, not public. Owners and managers use it. Three Git repositories make up the product.

## The three repos

- **`sales-crm-frontend`** — React 18 + Vite 5 SPA.
- **`sales-crm-backend`** — NestJS 11 API.
- **workspace root** (this doc lives here) — shared Claude instructions, architecture docs, planning state. Local-only.

Frontend and backend live side-by-side on disk but each has its own Git history. Cross-repo changes land as **separate commits** in each repo.

## Topology

```
                 ┌─────────────────────┐
                 │       Browser       │
                 │  React 18 + Vite 5  │
                 │  RTK Query  +  WS   │
                 └──────────┬──────────┘
                            │ HTTPS + WSS
                            ▼
                 ┌─────────────────────┐
                 │   NestJS 11 (API)   │
                 │   JWT auth guard    │
                 │   Permission guard  │
                 └──┬───────┬───────┬──┘
                    │       │       │
         ┌──────────┘       │       └──────────┐
         ▼                  ▼                  ▼
   ┌───────────┐     ┌───────────┐      ┌───────────┐
   │  Postgres │     │   Redis   │      │   B2 /    │
   │  + pgvec  │     │  + BullMQ │      │   S3      │
   └───────────┘     └─────┬─────┘      └───────────┘
                           │
                           ▼
                 ┌─────────────────────┐
                 │  Scanner Core jobs  │
                 │  AI evaluator       │
                 │  Discord notifier   │
                 │  Scheduled tasks    │
                 └─────────────────────┘
```

## Stack

### Frontend

- React 18, Vite 5.
- TypeScript (strict mode **off** project-wide).
- React Router 6.
- Redux Toolkit + RTK Query with axios base.
- styled-components (primary styling), MUI + Emotion also present.
- `npm` as package manager. No lint, no test framework.

### Backend

- NestJS 11 on Node.js.
- TypeScript (strict mode **off**).
- Prisma 6 ORM.
- PostgreSQL 16 with **pgvector**.
- Redis + **BullMQ** for queues.
- Socket.IO for realtime.
- Swagger for API docs.

## Data layer

- Prisma is the ONLY database access path. No raw SQL from services (one `$queryRaw` for a percentile aggregate in Job post stats is a documented exception).
- Services access Prisma directly today. **No global repository layer** — do not add one as a side effect of unrelated work.
- Migrations go through `make local-migrate` on dev and `prisma migrate deploy` on prod. **Never** `db push`.

## Realtime

- Socket.IO gateway on the backend.
- Frontend subscribes for notifications, chat, live job-post updates.

## Shared contracts

There is **no shared types package**. API shapes are declared independently in each repo. A backend contract change requires a matching, manual frontend change — land as separate commits.

## What the backend does *not* do

- No automated deploy. Prod ships via SSH + PM2 — see «Production deploy».
- No feature flags.
- No cross-tenant isolation (single-tenant product).
