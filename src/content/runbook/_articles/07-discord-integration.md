---
title: Discord integration
slug: discord-integration
category: Integrations
summary: Scheduled Discord notifications — TEST and PRODUCTION profiles, routing, and manual preview.
keywords: [discord, notification, profile, bot, scheduled, cron]
order: 4
updatedAt: 2026-10-06
---

The CRM sends scheduled notifications to Discord — daily reports, birthdays, reminders, previews. Two profiles exist: **TEST** and **PRODUCTION**. Exactly one is active at any moment.

## Profiles

Each profile stores:

- **Bot token** (encrypted at rest).
- **Guild ID** — the Discord server.
- **Channel IDs** — PMS, General, …
- **Manager role ID** — for mentions.
- **Schedule overrides** — per-job cron expressions.
- **active** flag — one row has `active: true` at a time.

Switching profile: open **Settings → Discord integration**, pick the inactive one, press **Activate**. The confirm modal flags any missing fields on the target profile.

## Flow

```
   @nestjs/schedule
   ┌──────────────┐
   │ hourly cron  │   emits BullMQ job
   │  (every N)   │ ──────────────────────▶ ┌───────────────────┐
   └──────────────┘                         │ notification      │
                                            │ processor         │
                                            └─────────┬─────────┘
                                                      │ reads active profile
                                                      ▼
                               ┌────────────────────────────────────────┐
                               │  DiscordProfileRouter                  │
                               │  active=TEST       → bot_token_test    │
                               │  active=PRODUCTION → bot_token_prod    │
                               └────────────────────┬───────────────────┘
                                                    │
                                                    ▼
                                        ┌──────────────────────┐
                                        │  Discord REST API    │
                                        │  POST message        │
                                        └──────────────────────┘
```

## Scheduled jobs

- **Daily report** — summary of the previous day's proposals / client calls / closed deals, posted to PMS channel at a configured time.
- **Birthdays** — daily birthday reminders to General.
- **Weekly summary** — Monday post with 7-day pipeline movement.
- **Scheduled reminders** — ad-hoc reminders set by managers.

Each job renders a message template, resolves channel + mentions via the active profile, and posts via Discord REST.

## Manual preview

The Discord integration panel has a **Preview** action per profile. Pick a job key (`daily-report`, `birthdays`, …) and press **Post** — it runs the same renderer that cron would run and posts to the configured channel immediately. Great for template changes.

## Test vs production

- **TEST profile** points at a sandbox guild + a dev bot token. Safe for template changes, template rendering fixtures, and when onboarding a new scheduled job.
- **PRODUCTION profile** points at the real Sargas workspace. Only this one is activated during normal operation.

Flipping to PRODUCTION requires:

1. Guild ID, PMS channel, General channel, manager role — all set.
2. Press Activate → confirm modal → request.

The previously-active profile is deactivated in the same transaction.

## Permissions

- `discord_integration:view` — read profiles, see preview actions.
- `discord_integration:update` — change profile fields.
- `discord_integration:activate` — switch the active profile.

Default: owner has all three; manager-admin has `view` only.

## Verifying access

The **Verify** action under *05 Diagnostics & tests* on each profile does a dry-run:

- Can the bot log into Discord with this token?
- Is the bot a member of the configured guild?
- Can it see / write to each channel?
- Does the manager-role id exist?

Nothing is posted. Results show as a checklist. Run this after any token or ID edit.
