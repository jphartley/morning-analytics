## Why

The `add-welcome-empty-state` validation run showed that the prior queue hardening work added useful mechanics but did not make the assistant workflow reliably use them. The queue still allowed wrong-checkout edits, raw verification before setup, noisy OpenSpec telemetry, partial finalization after archive failure, stale planning checkouts, and leftover finalized branches.

## What Changes

- Enforce Builder worktree boundaries as a blocking workflow step before implementation edits, with absolute candidate paths required in editing instructions.
- Make candidate setup the only valid path into queue-owned lint, build, serve, and finalization verification.
- Run queue-managed Node/npm commands under the repo-pinned Node runtime, or fail before mutating when the runtime does not match.
- Suppress or classify OpenSpec telemetry/network noise separately from actual OpenSpec command failures.
- Add archive preflight and finalization step-gating so archive aborts cannot be followed by squash merge and push without explicit partial-finalization recovery approval.
- After successful detached landing push, report and safely fast-forward the planning checkout when possible while preserving unrelated untracked files.
- Track queue-created pre-Gate artifacts so duplicate cleanup is precise.
- Clean up finalized candidate branches only after patch-equivalence and queue-state safety checks pass.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `openspec-delivery-queue`: strengthen enforcement for Builder boundaries, setup/runtime gating, telemetry handling, archive/finalization sequencing, planning checkout sync, artifact cleanup, and finalized branch cleanup.

## Impact

- Affected code includes `scripts/openspec-queue.mjs`, `.openspec-queue/config.json`, queue/start wrappers under `.agents/`, `.codex/`, and `.claude/`, and queue documentation.
- Queue command output will become more explicitly step-oriented, especially during setup, archive, merge, push, cleanup, and recovery.
- No morning app product behavior is expected to change.
