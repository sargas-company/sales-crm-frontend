---
title: Auth & permissions
slug: auth-and-permissions
category: Security
summary: JWT auth, HttpOnly refresh cookie, role-based permission model, and how guards enforce them.
keywords: [auth, jwt, permission, role, guard, security]
order: 3
updatedAt: 2026-10-06
---

Access is per-capability, not per-role. There is no global `isAdmin` flag. A role is a bag of capabilities; capabilities are named strings like `job_posts:view` or `salaries:update`.

## Model

```
   User ──roleId──▶ Role ──permissions──▶ RolePermission ──▶ Permission
                                                                   │
                                                                   ▼
                                                            key, e.g.
                                                            "job_posts:view"
                                                            "salaries:update"
```

- **User.roleId** → one role per user.
- **Role** has a many-to-many through `RolePermission`.
- **Permission** is the leaf — a flat list of capability strings.

Roles the system ships with:

- **Owner** — all permissions. Two seats.
- **Admin Manager** — operational access without money/compensation.
- **Manager** — leaner subset.

New roles are added by editing data, not code.

## Request path

```
   Request ──▶ JwtAuthGuard ──▶ PermissionGuard ──▶ Controller
                   │                 │
                   │                 └── reads @RequirePermission('…')
                   │                     decorator metadata, compares to
                   │                     user.permissions
                   │
                   └── validates the access token, loads user into req.user
```

Both guards are declared on `@Controller`-level and apply to every route unless the route uses `@Public()`.

## Tokens

- **Access token** — short-lived JWT, carried in `Authorization: Bearer`.
- **Refresh token** — stored as **HttpOnly** cookie `cookieParser` reads at app boot. Not accessible to JS; sent only on `POST /auth/refresh`.
- **Vault token** — separate HttpOnly cookie for the Credentials module (encrypted-attachment path).

## Permission decorator

Backend controllers mark required capabilities declaratively:

```ts
@Get()
@RequirePermission('job_posts:view')
findAll(@Query() dto: ListJobPostsDto, @Request() req) {
  return this.service.findAll(dto, req.user.id)
}
```

Omitting the decorator means **public** (or authenticated-only if the controller still uses `JwtAuthGuard`). Review every new endpoint for the right level.

## Frontend gates

```tsx
<PermissionGate permission='salaries:view'>
  <SalariesLink />
</PermissionGate>
```

- Hides UI the user cannot act on.
- Not a security boundary — the backend is the source of truth. Even if the frontend forgets to gate, the backend `PermissionGuard` refuses.

## Audit

Every sensitive action lands in `AuditLog`:

- Who (user id, email).
- What (action verb + target).
- Result (`SUCCESS` / `DENIED` / `FAILED`).
- Severity (`INFO` / `WARNING` / `CRITICAL`).
- Metadata + before/after diff on change actions.

Browse via **Governance → Audit log** in the CRM.

## Cross-user data isolation

The product is single-tenant. There is no org-level scope. Per-user state (e.g. job-post `viewedAt`) is modelled as a separate relation table keyed on `(userId, resourceId)` — see `JobPostView`.

On logout the frontend dispatches `baseApi.util.resetApiState()` so one user's RTK Query cache does not leak into the next session on the same browser.
