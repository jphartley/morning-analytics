## Context

See `proposal.md` for motivation. The app currently has a client-only `AuthSessionProvider`, all signed-in people receive the same controls, and top-bar preferences are restored from localStorage without a role boundary. Server actions accept a browser-provided user ID; the existing Technical Debt record identifies cookie-based server session verification as a future production hardening task.

The application already has user-scoped analyses and memories under Supabase RLS, twenty locally persisted palettes, three analyst personas, three view modes, a strict image-provider registry, and Test-only memory/diagnostic components. The current code defaults to Inkwell and Gemini 3.1 Pro Preview, but existing specs still describe older defaults in places.

## Goals / Non-Goals

**Goals:**

- Add a durable application role without altering per-user journal ownership.
- Give friends a low-cognitive-load normal experience with explicit, stable defaults.
- Preserve the owner's existing experimentation workflow behind the administrator experience.
- Make stored experimental preferences harmless when a browser is used by a normal account.

**Non-Goals:**

- Server-side session verification, `@supabase/ssr`, middleware, or a claim-based authorization system.
- An in-app role-management interface, cross-user journal access, or operator dashboards.
- A Gemini model-catalog update; the `gemini-3.6-flash` to `gemini-3.7-flash` update remains a separate future change.
- Palette synchronization across devices.

## Decisions

### 1. Use a `profiles` table with a database role

Create a `profiles` table keyed by `auth.users.id` with a constrained `role` value of `user` or `admin`. A database trigger creates a `user` profile after signup, and the migration backfills `user` profiles for existing accounts without overwriting an existing role. RLS permits each person to read their own role but not alter it.

The first release intentionally has no app UI for promotion. The owner will promote supplied account emails through a controlled Supabase operational step after deployment. No email addresses are stored in source control, environment configuration, or OpenSpec artifacts.

Alternative considered: server environment allowlist of admin email addresses. Rejected because role changes would require deployments, lack a durable audit point, and couple access to configuration rather than the authenticated account.

### 2. Add role to the client authentication context, with an explicit security boundary

After the existing browser client restores the Supabase session, the authentication provider loads the signed-in person's profile and makes an application role available to the app shell. The UI derives a capability set from that role rather than scattering role checks through individual controls.

This is deliberately a product/UI capability boundary for a small trusted trial, not a replacement for server authorization. Existing server actions and provider gates retain their current behavior until the separate session-hardening change replaces client-provided identity with verified server session context. The design, tasks, and tests must make this limitation visible rather than claiming that hidden controls are tamper-proof.

The application `admin` role is separate from Supabase project, database-owner, and service-role privileges. Application administrators remain scoped to their own journal data, while a trusted operator holding privileged Supabase access can technically bypass ordinary application row-level restrictions. Protecting and limiting those credentials is therefore an operational privacy boundary outside this product-role change.

Alternative considered: include `@supabase/ssr` and server role checks now. Deferred by explicit product decision so the friends-facing simplification can ship independently; it remains high-priority technical debt before wider exposure or sensitive admin mutations.

### 3. Model normal and administrator capabilities independently of visual density

Visual density is presentation; role is capability. A role-aware resolver determines the available modes and permitted selections before restoring browser preferences:

```text
normal user: Quiet, Insights; analyst and palette are selectable
admin:       Quiet, Insights, Test/Debug; existing experimental controls remain
```

For normal users, the resolver ignores stored `test` mode, model IDs, and provider selections. It chooses Quiet on first use, honors later Quiet/Insights and analyst preferences, and keeps palette persistence unchanged. Administrators retain their current stored preferences and all enabled Test/Debug functionality.

Alternative considered: build a separate admin tools route. Rejected for this release because retaining Test/Debug preserves the established workflow without duplicating the analysis page or introducing another navigation model.

### 4. Apply fixed normal-user generation defaults at the capability boundary

Normal user requests use Gemini 3.1 Pro Preview and the deployment-configured Midjourney/Discord provider. They do not submit model or provider overrides, even if localStorage contains old values. Midjourney failures surface as a user-safe retryable outcome; the strict provider registry continues to prohibit implicit fallback to Black Forest Labs or mock generation.

Administrators retain model selection in Insights/Test. The provider picker is visible only in enabled administrator Test/Debug, but a valid saved administrator provider override continues to apply in Quiet, Insights, and Test/Debug. The existing server/client feature flags remain prerequisites for admin provider overrides and Dual mode.

### 5. Disable contextual memory completely for normal users

Normal-user submission takes a memory-free analysis path and skips the post-save memory inference/update operation. This avoids creating additional derived sensitive context that the person cannot inspect or control and avoids spending inference calls without present product value. Their saved analysis records carry no memory-context snapshot. Any memories and evidence that already exist when an account resolves to the `user` role remain stored, unchanged, and dormant; role assignment, migration, and normal-user operation never delete them automatically.

Administrators retain current memory behavior and Test/Debug experiments, including no-memory, memory-enabled, blind-comparison, inspection, reset, and rebuild controls. All such actions remain scoped to the administrator's own records.

Alternative considered: build normal-user memories silently while not using them. Rejected because it adds retention and cost without a current normal-user benefit.

### 6. Preserve the all-user palette picker and correct its documented default

The existing floating palette picker remains available on auth and application pages for every role. Inkwell remains the first-use fallback and palette choices remain browser-local. The delta specification corrects the stale Reverie default in the design-token specification to match the runtime behavior.

## Risks / Trade-offs

- [Client-derived role is not a security boundary] → Keep server-action hardening explicitly deferred, retain restrictive deployment feature flags, and do not add cross-user or new destructive administrative data operations.
- [Privileged Supabase access can bypass application isolation] → Treat project, database-owner, and service-role access as trusted operational access; application `admin` status alone continues to grant no cross-user journal access.
- [Profile is unavailable during session restoration] → Treat the app as loading until role resolution succeeds; fail closed to the normal-user UI and present a recoverable error rather than exposing Test/Debug by default.
- [Existing admin browser preferences are interpreted as normal preferences before role loading] → Resolve role before restoring capability-sensitive preferences; normal accounts safely fall back to Quiet, Pro Preview, Midjourney, and no memory.
- [An existing account has contextual memory before receiving the normal-user experience] → Leave its memory and evidence dormant and unchanged; only an administrator's explicitly confirmed reset may delete them.
- [Midjourney's Discord integration can fail] → Retain the selected-provider-only behavior and show a concise retryable failure to normal users; keep detailed diagnostics to admin Test/Debug.
- [Profile trigger/backfill error during deployment] → Use an idempotent migration, validate profile counts against auth users, and retain a safe normal-user fallback until a profile is available.
- [Inkwell persists only in one browser] → Keep this intentional first-release behavior and document device-local persistence; cross-device preference sync is deferred.

## Migration Plan

1. Add the role/profile schema, RLS, signup profile creation, and idempotent backfill for existing authenticated accounts.
2. Deploy the application changes with all existing accounts treated as normal users until promoted; verify this role backfill does not delete or modify existing memories or evidence.
3. In Supabase, promote only the account emails the owner provides after deployment. Verify the promoted account receives Test/Debug and a normal account does not.
4. Ensure Railway production has `IMAGE_GENERATION_PROVIDER=midjourney`; review staged variable changes and deploy/redeploy. This is a required configured value, not a new variable. `NEXT_PUBLIC_*` values remain bundle-time values and any related change requires the same redeploy.
5. Roll back application code if needed; role data is non-destructive and can remain. A rollback preserves profiles but reverts the UI to its pre-role behavior, so operator access should be reviewed before rollback.
