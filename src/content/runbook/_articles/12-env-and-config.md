---
title: Environment & configuration
slug: env-and-config
category: Setup
summary: What goes into `.env`, which variables are required, and how the backend reads them at boot.
keywords: [env, environment, config, variables, boot, dotenv]
order: 2
updatedAt: 2026-10-06
---

Backend configuration is read from `.env` via `dotenv.config({ override: true })` in `src/main.ts`. No remote config service.

## Required variables

### Core

```
APP_ENV=local|staging|production
API_PORT=3006
DATABASE_URL=postgres://user:pass@host:5433/ai_dashboard
```

Local dev uses `APP_ENV=local` + port **5433** on `localhost` — the `scripts/assert-local-db.ts` guard enforces this five-signal check before running destructive Prisma commands. Mismatch → the guard aborts without leaking the URL.

### Auth

```
JWT_SECRET=…                 # access-token secret, min 32 chars
JWT_REFRESH_SECRET=…         # refresh-token secret, separate
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
```

Rotating `JWT_SECRET` invalidates every active session — users have to log in again.

### CORS

```
CORS_ORIGIN_1=https://crm.sargas.io
CORS_ORIGIN_2=https://sargas.io
```

Two slots today. Each origin added to the allowlist is matched **exactly** (scheme + host, no wildcard). Add a slot = add an env var + update the check in `src/main.ts`.

### Redis

```
REDIS_HOST=localhost
REDIS_PORT=6381           # local dev; prod is 6379
```

Dev port may differ from prod to avoid conflict with the host's own Redis.

### B2 storage

```
B2_KEY_ID=…
B2_APP_KEY=…
B2_BUCKET_PORTFOLIO_ID=…
B2_BUCKET_PORTFOLIO_NAME=…
B2_BUCKET_INVOICES_ID=…
B2_BUCKET_INVOICES_NAME=…
B2_BUCKET_REQUESTS_ID=…
B2_BUCKET_REQUESTS_NAME=…
B2_BUCKET_AVATARS_ID=…
B2_BUCKET_AVATARS_NAME=…

B2_SIGNED_TTL_PORTFOLIO_SECONDS=900
B2_SIGNED_TTL_INVOICES_SECONDS=900
B2_SIGNED_TTL_REQUESTS_SECONDS=900
B2_SIGNED_TTL_AVATARS_SECONDS=86400
```

Each bucket needs an id, a name, and a signed-URL TTL. Mis-matched id/name → PUT fails silently (or 401). Easiest sanity check: upload a 1-byte file from the backend REPL.

### Vault (encrypted credentials module)

```
VAULT_RP_ID=crm.sargas.io
VAULT_RP_ORIGIN=https://crm.sargas.io
VAULT_SESSION_SECRET=…       # separate from JWT_SECRET
```

Only the vault session can decrypt stored credentials. Rotating the secret invalidates every vault session.

### Discord integration

```
DISCORD_BOT_TOKEN_TEST=…     # dev bot
DISCORD_BOT_TOKEN_PROD=…     # production bot
# Guild / channel / role ids live in the DiscordProfile row, not in .env.
```

### AI (Anthropic)

```
ANTHROPIC_API_KEY=…
ANTHROPIC_MODEL_GATEKEEPER=claude-haiku-4-5-20251001
ANTHROPIC_MODEL_EVALUATOR=claude-sonnet-5-5
```

Model IDs point to the latest Claude 5 family (Sonnet 5.5, Haiku 4.5). Fallback behavior is in the service, not env.

### Sentry

```
SENTRY_DSN=https://…
SENTRY_ENV=production|staging
SENTRY_TRACES_SAMPLE_RATE=0.1
```

Omit `SENTRY_DSN` to disable Sentry (useful locally).

### Scanner Core webhook (Vibe)

```
VIBE_WEBHOOK_SECRET=…        # verifies incoming POSTs from Vibe Worker
```

Requests without a matching `x-vibe-signature` are rejected 401.

## Boot order

`src/main.ts` sequence:

1. `import './instrument'` — Sentry init (must run before anything else).
2. `dotenv.config({ override: true })` — load `.env`.
3. `NestFactory.create(AppModule, { rawBody: true })` — rawBody needed for Discord Interactions signature verification.
4. `cookieParser()` middleware.
5. `enableCors(…)` — reads `CORS_ORIGIN_*`.
6. `GlobalExceptionFilter` + `ValidationPipe { whitelist, forbidNonWhitelisted, transform }`.
7. In non-production: `setupSwagger(app)`.
8. `app.listen(API_PORT)`.

If a required env is missing, the service either throws on first use or Nest refuses to construct the module. Prefer the latter — put explicit `throw` in `useFactory` for critical config.

## `.env.example`

Lives in each repo root. Keep it in sync when adding new variables. **Never put real secret values** in `.env.example` — placeholders only. If a value in `.env.example` looks like a real credential, stop and warn immediately.
