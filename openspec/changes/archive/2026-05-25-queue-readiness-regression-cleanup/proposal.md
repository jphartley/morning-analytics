## Why

The `add-welcome-empty-state` queue validation run showed that prior app/repo hygiene documentation did not reliably become queue behavior: candidate verification still ran before setup, Node 22 was not enforced, safe build env was rediscovered manually, and OpenSpec archive was blocked by invalid main spec structure. This cleanup turns those recurring readiness contracts into enforceable preconditions and repairs the spec hygiene blocker left behind by the run.

## What Changes

- Make missing `app/node_modules` a queue setup/preflight condition instead of something first discovered by failed lint or build commands.
- Treat the app's Node 22 pin as a hard precondition for queue-managed `npm ci`, lint, build, and serve commands, including reporting the active Node version before verification.
- Ensure candidate setup prepares real, mock, or safe placeholder Supabase env before build verification and reports the resulting env mode.
- Repair `openspec/specs/app-shell/spec.md` structure so existing requirements live under a valid `## Requirements` section without changing app-shell behavior.
- Archive the completed `add-welcome-empty-state` change once app-shell spec structure no longer blocks OpenSpec archive, or confirm no active artifacts remain if prior cleanup already removed them.
- Add lightweight finalization/archive preflight coverage so touched main specs are structurally valid before merge/push finalization proceeds.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `app-repo-queue-readiness`: strengthen the readiness contract so documented dependency, Node, and build-env expectations are consumed by queue setup instead of rediscovered manually.
- `node-version-pinning`: extend Node 22 runtime expectations from project/deployment configuration into candidate verification command preconditions.
- `openspec-delivery-queue`: add setup/runtime/env/spec-structure gating requirements for candidate verification and finalization readiness.

## Impact

- Affected files may include `scripts/openspec-queue.mjs`, `.openspec-queue/config.json`, queue and `/opsx:start` wrappers under `.agents/`, `.codex/`, and `.claude/`, `openspec/specs/app-shell/spec.md`, any remaining active `add-welcome-empty-state` artifacts, and related OpenSpec specs.
- Candidate setup output and finalization preflight behavior will become stricter before lint, build, serve, archive, merge, or push.
- No morning app product UI/runtime behavior is expected to change except through build/setup reliability.
