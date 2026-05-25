## Why

The first real queued delivery run succeeded, but it exposed app and repository hygiene issues that made a small candidate depend on unrelated baseline cleanup, improvised dependency setup, and unclear local env handling. Cleaning up those conditions now makes future queued work more predictable without redesigning the queue architecture.

## What Changes

- Document and verify that `main` is expected to pass the app baseline checks before queue work starts.
- Clarify clean worktree setup for the app, including Node version expectations, `npm ci`, registry-safe lockfile checks, and avoiding unvalidated `node_modules` symlink shortcuts.
- Add or update local env documentation and example values so build-only placeholders are distinguished from manual-test-ready Supabase/auth configuration.
- Add an auth manual-test readiness convention so candidates are not handed off for login testing while using placeholder backend config.
- Standardize the lint-clean markdown renderer prop pattern if any current renderers still need it, and document the pattern near the reusable helper or implementation.
- Update queue-facing guidance so unrelated baseline verification failures stop the candidate and require a separate change or explicit approval before cleanup is included.

## Capabilities

### New Capabilities

- `app-repo-queue-readiness`: repository and app readiness expectations that support clean queued worktrees, baseline verification, local env setup, auth manual testing, and known lint patterns.

### Modified Capabilities

- `openspec-delivery-queue`: queued delivery policy for distinguishing candidate-caused verification failures from unrelated baseline failures before cleanup expands a candidate scope.

## Impact

- Affected files may include app documentation, `app/.env.example`, queue-facing docs or skills, markdown renderer components/helpers, and OpenSpec specs for app repository readiness and queue verification policy.
- Verification should include `npm run lint`, `npm run build`, and `npm run check:lockfile-registry` from `app/`.
- No production secrets, service credentials, queue architecture redesign, or broad test-suite introduction are expected.
