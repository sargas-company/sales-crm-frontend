---
title: Incident response
slug: incident-response
category: Incidents
summary: First five minutes of an incident — triage, communication, mitigation, post-mortem.
keywords: [incident, outage, 500, down, postmortem]
order: 1
updatedAt: 2026-10-06
---

Keep this short. Everything else is in the runbooks for specific systems.

## Minute 0-2 — Confirm

- Reproduce from a clean browser session; is it really down for everyone, or just you?
- Check **Sentry** last 15 min — look for a flood of new errors.
- Check **PM2** on prod: `pm2 status`, `pm2 logs sales-crm-back-end --lines 80 --nostream`.

## Minute 2-5 — Communicate

- Post in `#ops` a one-liner: **what**, **since when**, **impact**, **owner (you)**.
- Keep updating every 10 minutes until resolved. Even «still investigating» is useful.

## Mitigate

- If a recent deploy correlates — **roll back** per the «Production deploy» runbook.
- If the DB is overloaded — identify the heavy query (`pg_stat_activity`) and kill it.
- If auth is broken — check `CORS_ORIGIN_*` in `.env`, Sentry stack traces, and `JWT_SECRET`.

## Post-mortem (within 48h)

A short write-up: timeline, root cause, blast radius, what we are changing. Attach to the Resources section of the CRM for the team.
