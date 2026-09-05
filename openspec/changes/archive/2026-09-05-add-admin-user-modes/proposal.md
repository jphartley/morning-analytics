## Why

Morning Analytics now needs to be usable by a small group beyond its original single-user, experimental workflow. The current signed-in UI exposes model, provider, memory, diagnostic, and test controls that create unnecessary cognitive load for ordinary journal users.

## What Changes

- Add a database-backed `user` / `admin` role for authenticated accounts. New accounts default to `user`; initial administrators are promoted through an operational Supabase step, not an in-app user-management screen.
- Present normal users with only Quiet and Insights views, their analyst picker, the existing palette picker, and the core journal/history workflow.
- Make the normal-user defaults explicit: Inkwell palette, Quiet first view, Jungian Analyst first persona, Gemini 3.1 Pro Preview analysis model, Midjourney/Discord image generation, and no contextual-memory retrieval or creation.
- Preserve the existing admin workflow: Quiet, Insights, and Test/Debug views; model selection in Insights and Test/Debug; and provider-picker, mock-state, memory-experiment, diagnostic, and rebuild/reset controls in Test/Debug. A valid saved administrator provider override continues to apply in every administrator view even though its picker is visible only in Test/Debug.
- Keep Midjourney failures visible as a friendly retryable outcome for normal users; do not silently fall back to another provider.
- Keep palette selection available to all users and browser-local.
- **BREAKING** Normal-user UI will no longer expose Test/Debug, model selection, provider selection, contextual-memory experiments, or diagnostic controls. Existing browser-stored Test view and hidden selections must fall back safely to normal-user defaults.
- Keep any contextual memory and evidence that already exists for an account stored, unchanged, and dormant while that account has the normal-user experience; role migration and normal-user operation never delete it automatically.
- Defer server-side session verification and server-enforced role authorization to a follow-up security-hardening change. This change scopes roles to the product UI/capability boundary for a small trusted friends trial.
- Keep application administrators scoped to their own journal data. Privileged Supabase project, database-owner, or service-role access remains a separate trusted operational boundary that can technically access data beyond application-level isolation.

## Capabilities

### New Capabilities

- `user-roles`: Define persisted user/admin roles, default role assignment, and the first-release operational promotion model.
- `role-aware-experience`: Define which application surfaces and defaults are available to normal users versus admins.

### Modified Capabilities

- `user-auth`: Create a default user-role record for new authenticated accounts without changing the existing email/password signup flow.
- `view-density-modes`: Make Quiet the normal-user first view, restrict Test/Debug to admins, and safely recover unsupported stored views.
- `model-picker`: Limit model selection to admins in Insights and Test/Debug while using Gemini 3.1 Pro Preview for normal-user analyses.
- `image-provider-selection`: Keep Midjourney/Discord as the normal-user deployment default, limit the normal UI to that provider without implicit fallback, and keep saved administrator overrides active across administrator views while exposing the picker only in Test/Debug.
- `contextual-memory`: Disable contextual-memory retrieval and creation for normal-user analyses while retaining it for admins without deleting existing normal-user-owned memory or evidence.
- `memory-experimentation`: Restrict Test-view comparison, diagnostics, reset, and rebuild experimentation to admins.
- `image-generation-diagnostics`: Restrict detailed diagnostics to admins in Test/Debug while retaining user-safe failures for normal users.
- `design-tokens`: Make Inkwell the documented first-use palette while preserving the user-facing, browser-local palette picker.
- `app-shell`: Render role-aware controls and a simplified normal-user application shell.

## Impact

- Affects Supabase schema and migration work for role records and default-role creation.
- Affects auth context/profile loading, page capability composition, top-bar presets, view persistence, memory dispatch, provider picker visibility, diagnostics, and tests.
- Requires an operational post-deploy promotion step for the account emails the owner supplies later; no emails or secrets are committed.
- Requires Railway production review/deploy only if environment-variable configuration changes are introduced during implementation. No new environment variable is proposed by this change.
- Does not include the separate Gemini Flash catalog update or the deferred `@supabase/ssr` server-session hardening.
