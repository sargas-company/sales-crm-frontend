---
title: Scanner Core pipeline
slug: scanner-core-pipeline
category: Pipelines
summary: How job posts come in from Upwork — ingest, gatekeeper, AI evaluator, dispatch to Discord.
keywords: [scanner, vibe, worker, job post, ingest, bullmq, pipeline, ai]
order: 2
updatedAt: 2026-10-06
---

Scanner Core is the ingest pipeline for inbound Upwork job posts. Posts move through several stages before they land in the CRM as evaluated opportunities.

## Flow

```
   ┌────────────────┐    POST /vibe/ingest       ┌───────────────────┐
   │  Vibe Worker   │ ─────────────────────────▶ │  JobPostController │
   │  (external)    │   providerJobId key        └─────────┬─────────┘
   └────────────────┘                                      │ idempotent upsert
                                                           ▼
                                                 ┌───────────────────┐
                                                 │     JobPost       │
                                                 │  status: NEW      │
                                                 └─────────┬─────────┘
                                                           │ BullMQ enqueue
                                                           ▼
                                              ┌────────────────────────┐
                                              │  job-post-processor    │
                                              │  queue (concurrency N) │
                                              └──────────┬─────────────┘
                                                         │
                              ┌──────────────────────────┼──────────────────────────┐
                              ▼                          ▼                          ▼
                   ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
                   │   Gatekeeper AI     │    │   Field parsing     │    │   Score + decision  │
                   │  fit? reason?       │ ─▶ │  budget, location,  │ ─▶ │  AI evaluator       │
                   └─────────┬───────────┘    │  skills, rate       │    └─────────┬───────────┘
                             │ fit=false      └─────────────────────┘              │
                             ▼                                                     ▼
                   ┌─────────────────────┐                               ┌───────────────────┐
                   │  status: PROCESSED  │                               │   status:         │
                   │  decision: decline  │                               │   PROCESSED       │
                   │  AI reason stored   │                               │   decision/score  │
                   └─────────────────────┘                               └───────┬───────────┘
                                                                                 │
                                                                                 ▼
                                                                        ┌────────────────┐
                                                                        │   Discord      │
                                                                        │   notifier     │
                                                                        │   (schedule)   │
                                                                        └────────────────┘
```

## Idempotency

Vibe Worker delivers the same vacancy multiple times (retries, re-scrapes). `JobPost.providerJobId` is **`@unique`** — a repeat delivery of the same vacancy is a Prisma upsert, not a second row.

Legacy Telegram-staged posts use `(chatId, messageId)` as the dedupe key instead. Both coexist today.

## Gatekeeper AI

The gatekeeper is a short, cheap model call that answers a boolean:

> *«Does this post fit the agency's book? If no, why?»*

Enforced through Anthropic SDK **tool_use** with a strict input schema:

```json
{
  "fit": true,
  "reason": "React + Node + CRM, team size 2-3, remote OK"
}
```

- `fit: true` → post goes to the full evaluator.
- `fit: false` → post is marked `decision: decline` immediately with the reason stored in `aiResponse`. The expensive evaluator never runs on these.

## AI evaluator

Runs the full prompt — scores sub-dimensions (budget-fit, scope-fit, tech-fit, red flags), produces a `matchScore` (0-100), a priority (`high`/`medium`/`low`), and the final `decision`.

The active prompt is read from the `Prompt` table where `type = 'JOB_EVALUATION'` and `isActive = true`. Updating prompts creates a new row with `version + 1`.

## Scheduling

Scanner Core uses **`@nestjs/schedule`** with `@Cron` guarded by timestamp-based stale-recovery (if a cron tick is missed by more than `STALE_GUARD_MS`, the next tick picks up the work).

Queue recovery lives in the scheduler's first-tick hook — not in `onModuleInit` — so app boot never blocks on BullMQ connectivity.

## Observability

- Every stage logs with `JobPost.id` in context.
- `JobPostIngestEvent` table records each ingest attempt (success / error / dedupe).
- Sentry captures exceptions from the pipeline with request-id correlation.
