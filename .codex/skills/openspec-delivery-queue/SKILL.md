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
- Inside the candidate worktree, invoke OpenSpec apply/context before coding.

Safety boundary: edit only the assigned candidate worktree. Do not archive, merge, push, finalize, or clean up.

### Test Preparer

Purpose: verify and prepare manual testing.

Scripts:
- `prepare-test <change>` runs default verification, allocates/reuses a port, starts the dev server when capacity permits, creates a draft commit when verification passes, and emits the handoff.
- `serve <change>` starts or restarts the dev server.
- `stop <change>` stops the dev server.

Safety boundary: do not approve Gate 2 or finalize.

### Finalizer

Purpose: after user approval, land the candidate on `main`.

Scripts:
- `finalize <change> --confirm-gate2`: stop server, use landing worktree, rebase when conflict-free, rerun verification, archive OpenSpec, squash merge into `main`, push, and mark finalized.
- `cleanup <change>` removes finalized local resources only when safe.
- `recover [<change>]` prints safe recovery actions.

Safety boundary: only call `finalize` after explicit Gate 2 approval. Never delete dirty worktrees.

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
```

Prepare manual testing:
```bash
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
