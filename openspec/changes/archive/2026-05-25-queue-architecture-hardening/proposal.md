## Why

The first real Parallel OpenSpec Delivery Queue run completed, but it exposed workflow gaps that made normal queue operations noisy, fragile, and dependent on ad hoc manual recovery. Hardening the queue now reduces risk before more work is routed through queued worktrees.

## What Changes

- Add mechanical Builder boundary checks so implementation starts only from the assigned candidate worktree and the planning checkout remains untouched.
- Make candidate worktree placement, sandbox expectations, and queue preflights explicit so normal setup, build, archive, and cleanup actions do not require repeated improvisation.
- Add first-class candidate bootstrap for dependencies and local environment handling before build, serve, or Gate 2 handoff.
- Improve dev server startup, logging, and local readiness checks so Gate 2 is presented only when the candidate URL is actually reachable or clearly reported as failed.
- Fix finalization behavior for repositories where `main` is already checked out in the planning checkout, and surface landing blockers before Gate 2 handoff.
- Add queue-owned recovery finalization and archive paths so successful recovery does not require manual queue-state edits or direct destructive commands in assistant flow.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `openspec-delivery-queue`: strengthen worktree boundaries, candidate setup, readiness, finalization, recovery, and archive requirements for queued delivery.

## Impact

- Affected code includes `scripts/openspec-queue.mjs`, `.openspec-queue/config.json`, queue skills and command wrappers under `.agents/`, `.codex/`, and `.claude/`, and any docs or OpenSpec artifacts that describe queue operation.
- Queue command output and preflight behavior will become stricter before implementation, Gate 2 handoff, finalization, and cleanup.
- No application runtime behavior, user-facing app routes, or production service dependencies are expected to change.
