---
title: Data model map
slug: data-model-map
category: Architecture
summary: Key Prisma models and how they relate — users, roles, pipeline, finance, scheduled events.
keywords: [prisma, model, schema, relations, erd]
order: 2
updatedAt: 2026-10-06
---

The database is the single source of truth. This map shows the model relationships that drive the main product areas. Column lists are not exhaustive — see `prisma/schema.prisma` for the authoritative definition.

## Auth & access

```
         User ──roleId──▶ Role ──┐
          │                      │
          │                      ▼
          │             RolePermission ──▶ Permission
          │
          │   AuditLogActor
          ├──────────────▶ AuditLog
          │
          │   jobPostViews
          └──────────────▶ JobPostView (userId, jobPostId)
```

## Sales pipeline

```
   Lead ─┐
         │ convertToProposal
         ▼
   Proposal ◀── jobPostId ── JobPost ──views── JobPostView
         │
         │ sent on
         ▼
   Platform (Upwork, LinkedIn, direct, …)
         │
         ▼
   Account ───▶ ClientCall
                 │
                 └──▶ ClientRequest (public contact form submissions)
                           │
                           └── files[] → B2
```

- **Lead** — top-of-funnel contact, no commitment yet.
- **Proposal** — bid or direct offer sent through a platform. Tied to one `jobPost` optionally (if it came from Scanner Core) and one `userId` (who sent it).
- **ClientRequest** — inbound inquiry from the public contact form. Carries files uploaded with the request.
- **ClientCall** — a scheduled or past call. References any client-side entity (`clientType` + `clientId`).

## Project delivery

```
   Project ──┬── members[] ──▶ ProjectMember ──▶ Employee
             │
             ├── reports[] ──▶ ProjectReport
             │                      │
             │                      ├── MANUAL  → employeeId required
             │                      └── DISCORD → discordUserId / discordUsername
             │                                    (employeeId NULL)
             │
             └── Invoice (via counterparty, platform, …)
```

A single project may have *both* MANUAL and DISCORD reports — the `/report` Discord slash command lands as `source: DISCORD` with the Discord username only (no Employee link).

## Finance

```
   Employee ──▶ Compensation ──▶ Promotion (comp review)
                   │
                   ▼
   PaymentSource ──▶ Salary (payout)
```

Salaries are month-scoped records. A `PaymentSource` is a bank/wallet from which payouts are made. Compensation + Promotion track what someone is owed; Salary tracks what has been paid.

## Scanner Core

```
   JobPost
     ├── providerJobId (unique)  → Vibe Worker idempotency key
     ├── chatId, messageId        → legacy Telegram staging key
     ├── aiResponse (jsonb)       → gatekeeper + evaluator output
     └── ingestEvents[] ──▶ JobPostIngestEvent
```

## Discord integration

```
   DiscordProfile (TEST | PRODUCTION)
     ├── bot_token (encrypted)
     ├── guildId, channels (JSONB)
     ├── managerRoleId
     ├── active (boolean, unique: only one TRUE)
     └── schedule_overrides (JSONB)
```

## Credentials vault

```
   Credential
     ├── encryptedPayload (sealed with vault token)
     ├── permissions (per-user access list)
     └── auditLogs (every reveal / edit)
```

Only owners can issue a vault session. Managers can be granted read access per credential.

## Audit trail (cross-cutting)

Every write to a sensitive table emits an `AuditLog` row with `before` + `after` JSON diffs. The frontend's `/audit-log/all-activity` renders these.
