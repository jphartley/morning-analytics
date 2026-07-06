---
name: openspec-delivery-queue
description: Orchestrate the gated OpenSpec delivery queue using portable repo-local scripts.
license: MIT
compatibility: Requires openspec CLI and Node.js.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "parallel-openspec-delivery-queue"
---

Use this skill when the user wants to work with the parallel OpenSpec delivery queue: approve a design gate, start queued work, prepare a manual testing handoff, reject a candidate, finalize an approved candidate, inspect status, or recover interrupted work.

## Principle

OpenSpec owns the proposal/spec/design/tasks contract. The queue scripts own deterministic local operations. This skill is a readable orchestration wrapper: it explains which script is called, why it is called, and what state transition to expect.

Portable entrypoint:

```bash
node scripts/openspec-queue.mjs <command>
```

Prefer `--json` when another assistant/tool needs machine-readable output. Use `--dry-run` before risky local operations when previewing is useful.

## Roles And Script Calls

### Queue Manager

Purpose: manage queue state and FIFO execution.

Scripts:
- `status [<change>]`: inspect current queue state.
- `doctor`: check config, git/worktree state, ports, stale server metadata, and recoverability.
- `approve <change>`: record explicit Gate 1 approval and enqueue the change. The script does not decide readiness.
- `start [<change>|--next]`: create/reuse the candidate branch/worktree and snapshot approved OpenSpec artifacts.

Safety boundary: do not approve Gate 1 for the user. Only call `approve` after the user explicitly approves the Design Gate Brief.

### Intent Reviewer

Purpose: create the Design Gate Brief from OpenSpec artifacts.

Scripts:
- `status [<change>]`: optional context.

No script decides intent readiness. Read `proposal.md`, `specs/**/*.md`, `design.md`, and `tasks.md`, then produce a short brief with intent, UX/behavior changes, scope boundaries, risks/assumptions, technical escalations, manual test focus, and ready-to-build recommendation.

Safety boundary: route fuzzy intent back to OpenSpec artifact refinement.

Design Gate Brief template:

```text
Design Gate Brief: <change>

Intent
<1-3 sentences>

UX / Behavior Changes
- <only user-visible or workflow-visible changes>

Scope Boundaries
- <what this change will not do>

Key Risks / Assumptions
- <risks most likely to cause wrong implementation or surprise>

Technical Escalations
- <dependencies, env, Supabase/RLS, auth/session, deployment, package/lockfile, background service risk>

Manual Test Focus
- <2-4 things the user should manually verify>

Ready to build: yes/no
Reason: <short reason>
```

Recommend `Ready to build: no` when product behavior is unclear, UX behavior is missing, scope is unbounded, important edge cases are unnamed, or technical escalation is significant and unreviewed.

### Conflict Guard

Purpose: detect high-risk overlap before or during implementation.

Scripts:
- `approve <change>` records artifact-derived expected touch areas.
- `start [<change>|--next]` blocks high-risk overlap when detected.
- `status [<change>]` shows blocked state.

Safety boundary: interrupt the user only for high-risk conflicts.

### Builder

Purpose: implement the approved change in the assigned candidate worktree.

Scripts:
- `start <change>` prepares the worktree and snapshots artifacts.
- `builder-preflight <change>` verifies the current repo root, absolute worktree path, branch, and queue item before implementation begins.
- Inside the candidate worktree, invoke OpenSpec apply/context before coding.

Safety boundary: run `builder-preflight` from the candidate worktree immediately before implementation edits. Every implementation patch path must be under the absolute candidate worktree path reported by `start`. Do not archive, merge, push, finalize, or clean up.

### Test Preparer

Purpose: verify and prepare manual testing.

Scripts:
- `setup <change>` prepares candidate dependencies, validates the repo-pinned Node runtime, and prepares ignored env files without printing secret values.
- `prepare-test <change>` runs setup, enforces recent Builder preflight, runs default verification, planning-checkout contamination checks, landing preflight, dev-server readiness checks, creates a draft commit when verification passes, and emits the handoff.
- `serve <change>` runs setup, starts or restarts the dev server, captures logs, and probes readiness.
- `stop <change>` stops the dev server.

Safety boundary: do not approve Gate 2 or finalize. Do not run raw `npm run lint`, `npm run build`, or dev-server commands for a candidate outside queue-managed setup. Do not present a URL as ready unless the queue reports readiness.

Manual test handoff: whenever a candidate is ready for user testing, include the clickable queue-reported dev server URL in the final handoff. If the server is not ready, state that explicitly and include the queue command or next action needed to obtain a test link.

Verification scope policy: full `npm run lint` and `npm run build` remain expected candidate checks. If a failure is caused by the candidate, fix it in the candidate worktree. If a failure is unrelated baseline debt that predates the candidate, stop, report it separately, and continue only after explicit user approval to include that cleanup or after a dedicated hygiene change fixes the baseline.

### Finalizer

Purpose: after user approval, land the candidate on `main`.

Scripts:
- `finalize <change> --confirm-gate2`: stop server, use the detached landing worktree, rebase when conflict-free, rerun setup and verification, preflight and archive OpenSpec, squash merge into `main`, push, reconcile the planning checkout, and mark finalized.
- `cleanup <change>` removes finalized local resources and finalized candidate branches only when patch-equivalence and queue ownership checks pass.
- `recover [<change>]` prints safe recovery actions, finalization state, remaining steps, and risks.
- `recover-finalize <change> --confirm-recovery` runs the bounded recovery finalization plan only after explicit recovery approval.

Safety boundary: only call `finalize` after explicit Gate 2 approval. Archive failure stops merge and push. Only call `recover-finalize` after explicit recovery approval that lists the planned sub-steps. Never delete dirty worktrees or branches that are not patch-equivalent to `main`.

## Common Flows

Inspect:
```bash
node scripts/openspec-queue.mjs status
node scripts/openspec-queue.mjs doctor
```

Gate 1 approved:
```bash
node scripts/openspec-queue.mjs approve <change>
node scripts/openspec-queue.mjs start <change>
cd <absolute-candidate-worktree>
node scripts/openspec-queue.mjs builder-preflight <change>
# Apply implementation patches only under <absolute-candidate-worktree>
```

Prepare manual testing:
```bash
node scripts/openspec-queue.mjs setup <change>
node scripts/openspec-queue.mjs prepare-test <change>
```

Manual test failed:
```bash
node scripts/openspec-queue.mjs reject <change>
```

Manual test passed:
```bash
node scripts/openspec-queue.mjs finalize <change> --confirm-gate2
node scripts/openspec-queue.mjs cleanup <change>
```

`finalize` reports archive, merge, push, planning-sync, and duplicate-artifact cleanup separately. `cleanup` reports worktree and branch cleanup separately.

Recovery finalization:
```bash
node scripts/openspec-queue.mjs recover <change>
node scripts/openspec-queue.mjs recover-finalize <change> --confirm-recovery
```
