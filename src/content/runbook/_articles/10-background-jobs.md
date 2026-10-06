---
title: Background jobs & schedules
slug: background-jobs
category: Pipelines
summary: BullMQ queues and @Cron schedules — what runs where, retries, and how to recover from stuck jobs.
keywords: [bullmq, redis, queue, cron, schedule, retry, worker]
order: 3
updatedAt: 2026-10-06
---

Background work goes through two mechanisms:

- **BullMQ queues** for anything that needs retries, parallelism, or that must survive a restart.
- **`@nestjs/schedule` @Cron** for simple time-based triggers that enqueue BullMQ work.

## Topology

```
   ┌───────────────────────────┐
   │ NestJS boot               │
   │                           │
   │ ┌───────────────────────┐ │        enqueue
   │ │ @Cron schedulers      │ │ ───────────────────▶ ┌──────────────────┐
   │ │ (vibe-ingest,         │ │                      │ Redis + BullMQ    │
   │ │  notification,        │ │        consume       │ queue             │
   │ │  reminder, …)         │ │ ◀─────────────────── └──────────────────┘
   │ └───────────────────────┘ │
   │                           │
   │ ┌───────────────────────┐ │
   │ │ Processors (workers)  │ │
   │ │ - job-post-processor  │ │
   │ │ - notification-proc   │ │
   │ │ - vibe-ingest-proc    │ │
   │ └───────────────────────┘ │
   └───────────────────────────┘
```

Workers live in the same process as the API today — single-tier deployment. Can split later if needed.

## Queues

- **`job-post-processor`** — runs gatekeeper → parse → evaluator on each new `JobPost`.
- **`notification`** — Discord notifications (daily report, reminders, previews).
- **`vibe-ingest`** — upserts incoming job posts from the Vibe Worker webhook.
- **`portfolio-thumbnail`** — generates image thumbnails on upload.

Each queue has:

- Concurrency (default 2-4, bumped per-queue in config).
- Retry policy — exponential backoff, cap at 3 attempts for AI calls, 5 for I/O.
- Dead-letter path — jobs that exhaust retries land in a `failed` set in Redis and emit a Sentry event with the job data.

## Scheduled jobs (@Cron)

| Name | Cadence | What it does |
|------|---------|--------------|
| `vibe-ingest.scheduler` | every 1 min | Reconciles any missed Vibe payloads. First tick also does queue recovery. |
| `notification.daily-report` | daily, 09:00 | Builds yesterday's summary, enqueues Discord post. |
| `notification.weekly-summary` | Monday, 09:30 | 7-day pipeline movement, Discord post. |
| `reminders.sweep` | every 5 min | Enqueues due client-call reminders. |
| `job-post.cleanup` | daily, 03:00 | Soft-deletes PROCESSED posts older than retention. |

Every scheduler uses a **timestamp-based stale guard** (`STALE_GUARD_MS = 2 min`): if the previous tick's timestamp is older than the guard, the current tick picks up the work. This is how the system self-heals after a brief outage.

## Stuck job recovery

When a worker crashes mid-job, BullMQ leaves the job in `active` state. On next boot the `vibe-ingest.scheduler` first-tick re-queues anything in `active` back to `waiting`. **This recovery lives in the scheduler**, not in `onModuleInit`, so app boot never blocks on a slow Redis.

## Observability

- Every job logs with `jobId`, `name`, `attemptsMade`.
- Sentry captures the stack trace with job data as `extra` on terminal failures.
- `pm2 logs sales-crm-back-end --lines 400 --nostream | grep -iE "job|queue|cron"` is the quick triage query on prod.

## Troubleshooting

- **«Scheduler not firing»** — check `OnApplicationBootstrap` log line is present. If missing, Nest module order is off.
- **«Jobs pile up»** — Redis down or a stuck processor. Check `redis-cli info`, `pm2 status`, worker memory.
- **«Discord notifications missed»** — active profile not configured. See «Discord integration».
