---
title: AI prompts — gatekeeper & evaluator
slug: ai-prompts
category: Pipelines
summary: How the two prompts are stored, versioned, activated, and called via Anthropic SDK tool_use.
keywords: [ai, prompt, gatekeeper, evaluator, anthropic, versioning]
order: 4
updatedAt: 2026-10-06
---

The AI side of Scanner Core runs two prompts: **Gatekeeper** (cheap, boolean) and **Evaluator** (full match-score).

## Where prompts live

Table **`Prompt`**:

```
   id         uuid
   type       enum: JOB_GATEKEEPER | JOB_EVALUATION
   title      user-facing name
   content    markdown — the prompt body
   version    int, incremented per edit
   isActive   bool — exactly one TRUE per `type`
   createdBy  user id or 'seed'
   updatedBy  user id | null
   createdAt  / updatedAt
```

Editing a prompt via the CRM creates a **new row** (`version + 1`) with `isActive: true` and flips the previous active row to `isActive: false` in the same transaction. History is kept forever.

## Flow

```
   JobPost (status: NEW)
       │
       ▼
   fetch prompt where type=JOB_GATEKEEPER AND isActive=true
       │
       ▼
   Anthropic SDK → messages.create({
     tools: [{
       name: 'decide_fit',
       input_schema: {
         type: 'object',
         properties: {
           fit: { type: 'boolean' },
           reason: { type: 'string', minLength: 1, maxLength: 200 }
         },
         required: ['fit', 'reason']
       }
     }],
     tool_choice: { type: 'tool', name: 'decide_fit' },
     …
   })
       │
       ▼
   response.content[0] = { type: 'tool_use', input: { fit, reason } }
       │
       │─ fit=false ─▶ decision: decline, stop here
       │
       │─ fit=true  ─▶ enqueue evaluator
       ▼
   fetch prompt where type=JOB_EVALUATION AND isActive=true
       │
       ▼
   Anthropic SDK → messages.create({
     tools: [{ name: 'evaluate', input_schema: … }],
     tool_choice: { type: 'tool', name: 'evaluate' },
     …
   })
       │
       ▼
   { decision, match_score, priority, subscores, reasons, red_flags, short_summary }
```

## Why `tool_use` and not plain text

Forcing an `input_schema` guarantees the model returns parseable JSON. No regex, no «AI reply couldn't be parsed» class of 500. The `required` list in the schema is the backend contract.

The gatekeeper's `reason` is `required: true, minLength: 1, maxLength: 200` — the model always has to say *why*, even on `fit: true`. No fallback-reason crutches in service code.

## Editing a prompt (manager workflow)

1. **Resources → #runbook → prompt stuff** (future topic) or **go to Prompts list** in the CRM.
2. Open the active prompt, press **Edit**.
3. Edit **in Markdown mode** — the right-hand preview renders the exact text the model will see.
4. **Save changes** — a new version is created and auto-activated.
5. The next ingested post uses the new prompt immediately.

## Rolling back

Prompts are **append-only**. To roll back:

1. Open the prompts list.
2. Find the previous active version (filter by `type`).
3. Press **Activate** on it. The current head is deactivated.

No data is lost.

## Cost control

- Gatekeeper runs on **every** inbound post. Keep it short.
- Evaluator runs only when gatekeeper returns `fit: true` — typically 30-50% of inbound.
- Both prompts are read from DB on every call; no caching layer today. Cheap enough.
