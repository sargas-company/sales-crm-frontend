# Sargas CRM — Frontend rules

> Canonical brain, rules and project memory live **one level up** —
> start Claude sessions from the workspace root, not from this repo.

Nested under the workspace root. Workspace-level rules (git, security,
task flow, decisions, pattern map) live in `../CLAUDE.md` and
`../.claude/rules/`. **This file covers only the frontend stack.**

## Stack

- React 18 · Vite 5 · TypeScript (strict currently **off**) ·
  React Router 6 · Redux Toolkit + RTK Query (axios adapter) ·
  styled-components (primary) with MUI + Emotion also present ·
  package manager **npm**.
- `npm ci` currently requires `--legacy-peer-deps`
  (OPERATOR-VERIFIED 2026-10-11): `@mui/material` 9 conflicts with
  `@mui/icons-material` 5 peer ranges.
- No test framework configured; no lint command configured.

## Conventions

- **Data layer:** RTK Query is the server-data primary. Don't
  introduce react-query / SWR / plain fetch wrappers as a side
  effect.
- **Styling:** styled-components for new code. Don't bring in a
  second styling system (Tailwind / CSS Modules / vanilla-extract)
  as a side effect.
- Reuse existing design-system primitives (`src/components/_shared/*`
  and the pages listed in `../work/standards/pattern-map.md`) before
  writing new ones.
- Preserve loading / empty / error states in every component you
  touch. If a component handles them, keep the handling. If it does
  not, don't add speculative handling in an unrelated task.
- Don't enable `strict: true` globally as a side effect — enabling
  strict is its own task with its own review.

## Formatting

- No workspace-wide formatting runs — they pollute diffs. Format only
  the files you're already changing.

## Verification — read-only

- `npm run typecheck` — safe.
- `npm run format:check` — safe.

## Verification — writes files

- `npm run build:strict` runs `tsc --noEmit && vite build`. **Not
  read-only** — Vite writes to `dist/`. `dist/` is **git-ignored**
  here (`.gitignore`), not tracked. Still, when running it:
  1. `git status --short` before.
  2. Run the command.
  3. `git status --short` after; report the delta.
  4. Don't stage `dist/`, source maps or any generated artifact
     unless the task explicitly ships a build.

There is no test command and no lint command to run.

## Visual acceptance (reminder)

- Code compiling ≠ feature working.
- For UI changes, run the dev server and exercise the surface in a
  browser (golden path + the states you touched). If browser-level
  verification is not available in this session, say so explicitly —
  reading the source is not visual acceptance.
- The frontend design playbook is `../work/standards/frontend-design.md`;
  concrete reference pages are listed in
  `../work/standards/pattern-map.md`.

## Icons

Short version: `@mui/icons-material` everywhere; no emoji as icons.
The canonical rule — including its two exceptions (Discord embed
bodies; country-flag emoji rendered as data) — lives in
`../work/standards/frontend-design.md` § Icons. Don't restate it
elsewhere.
