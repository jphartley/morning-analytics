---
name: openspec-start
description: Start an OpenSpec-powered delivery flow from an idea, detailed request, or existing change and continue through the Design Gate, queued worktree implementation, verification, dev-server handoff, and Gate 2.
license: MIT
compatibility: Requires openspec CLI and Node.js.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "parallel-openspec-delivery-queue"
---

Use this skill when the user invokes `/opsx:start` or asks to take an idea, bug report, issue, or existing OpenSpec change all the way to a manual-testing handoff.

`/opsx:start` is a harness around explicit OpenSpec commands and the portable queue script. It does not replace OpenSpec, approve intent for the user, or finalize a candidate without manual test approval.

## Principle

OpenSpec owns the meaning of the change: proposal, specs, design, tasks, apply/context guidance, validation, and archive semantics.

This skill owns orchestration:
- route the request to `/opsx:explore`, `/opsx:propose`, `/opsx:continue`, or direct artifact review
- create the Design Gate Brief
- enforce Gate 1 and Gate 2
- call queue scripts for deterministic local state transitions
- invoke the Builder inside the candidate worktree
- prepare the Gate 2 handoff and wait with the dev server running when possible

Portable queue entrypoint:

```bash
node scripts/openspec-queue.mjs <command>
```

Use `--json` when parsing state. Use human-readable output when showing the user what happened.

## Input Routing

First decide where the user's input should go. Always state the selected route and why.

### Route To Explore

Invoke `/opsx:explore` first when the input is fuzzy, speculative, very short, or explicitly exploratory.

Signals:
- words such as `brainstorm`, `explore`, `think through`, `investigate`, `not sure`, `maybe`, `idea`, `rough`, `unclear`
- two or three word requests with little context
- competing options with no chosen direction
- product intent or UX behavior is still unknown

After exploration clarifies the intent, transition to `/opsx:propose`. If exploration is a dead end or the user redirects, stop without creating queue state.

### Route To Propose

Invoke `/opsx:propose` when the input is detailed enough to create apply-ready artifacts.

Signals:
- a concrete bug report
- reproduction steps
- acceptance criteria
- issue text or issue reference
- a clear behavior change
- enough detail to name scope, UX/behavior, and risks

### Route To Continue

Invoke `/opsx:continue` when the user points to an existing active OpenSpec change that is missing required artifacts.

Check with:

```bash
openspec status --change "<change>" --json
```

Continue until the change has all artifacts required for implementation review.

### Route To Existing Apply-Ready Change

If the user points to an existing active change and `openspec status --change "<change>" --json` shows the apply-required artifacts are done, read the artifacts directly and create the Design Gate Brief.

## Artifact Readiness Before Gate 1

Before creating the brief, verify the change is apply-ready:

```bash
openspec status --change "<change>" --json
openspec instructions apply --change "<change>" --json
```

Read every path in `contextFiles`. For the spec-driven schema this usually means:
- `proposal.md`
- `specs/**/*.md`
- `design.md`
- `tasks.md`

Do not create queue runtime state before Gate 1 approval.

## Design Gate Brief

Create a compact brief for the user. Keep it short enough to review quickly.

Template:

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

## Gate 1: Strict Approval

Never auto-approve Gate 1, even for tiny changes.

Clear approvals include:
- `approve gate 1`
- `approved`
- `approved, build it`
- `looks good, start building`
- `queue it`
- `start the build`

Ambiguous responses do not approve:
- `nice`
- `ok`
- `sounds good`
- `interesting`
- `continue`
- `maybe`

If the response is ambiguous, ask for explicit Gate 1 approval before queueing.

## After Gate 1 Approval

After strict Gate 1 approval, continue automatically to Gate 2. Do not ask the user to run another command on the happy path.

Call the queue scripts in this order.

### 1. Approve

```bash
node scripts/openspec-queue.mjs approve <change>
```

Why: records the user's explicit Gate 1 approval and enqueues the change.

Safety boundary: the script records approval supplied by the user; it does not decide readiness.

Expected result: local queue state contains a queued item with approved artifact-derived touch areas.

### 2. Start

```bash
node scripts/openspec-queue.mjs start <change> --json
```

Why: creates or reuses the candidate branch/worktree, snapshots approved OpenSpec artifacts, applies FIFO/conflict rules, and reports the worktree path.

Safety boundary: high-risk conflicts block or sequence work; implementation must happen only in the assigned candidate worktree.

Expected result: the item is active and has branch/worktree metadata, absolute candidate path, and the `builder-preflight` command to run before editing.

If `start` reports a high-risk conflict, interrupt the user. Otherwise continue.

## Builder Step

Run the Builder inside the candidate worktree reported by `start`.

In the candidate worktree:

```bash
node scripts/openspec-queue.mjs builder-preflight <change>
openspec status --change "<change>" --json
openspec instructions apply --change "<change>" --json
```

Read the returned `contextFiles`, implement pending tasks, and mark each completed task in the candidate worktree's `tasks.md`.

Builder safety boundaries:
- edit only inside the assigned candidate worktree
- do not start editing until `builder-preflight` passes immediately before the first implementation edit
- use absolute file paths under the assigned candidate worktree for implementation patches
- keep changes focused on the approved artifacts
- interrupt if implementation reveals design ambiguity
- do not archive, merge, push, finalize, or clean up

If implementation reveals a design ambiguity, stop and loop back to OpenSpec artifact refinement before continuing.

## Prepare Gate 2

After implementation reaches a candidate state, call:

```bash
node scripts/openspec-queue.mjs prepare-test <change>
```

Why: runs queue-owned setup, validates the repo-pinned Node runtime, derives change-specific checks from OpenSpec artifacts, creates a draft commit when verification reaches a candidate state, allocates or reuses a port, starts the dev server when capacity permits, and emits the manual-testing handoff.

Safety boundary: this prepares the handoff only. It does not approve Gate 2 or finalize. It must report dependency state, Node version, setup/env mode, planning-checkout contamination, finalization landing readiness, and dev-server readiness. Do not run raw candidate `npm run lint`, `npm run build`, or dev-server commands outside queue-managed setup.

Expected result: a compact handoff with change name, branch, worktree, reachable local URL or explicit stopped/failed server state, verification result, known risks, and Gate 2 instructions. Leave the dev server running when readiness succeeds and capacity permits.

If the server could not start because capacity is full, present the stopped-ready state and the command needed to serve it:

```bash
node scripts/openspec-queue.mjs serve <change>
```

## Gate 2: Strict Approval Or Rejection

Wait for the user after presenting the handoff.

Clear approvals include:
- `approve gate 2`
- `tested and approved`
- `manual test passed`
- `finalize it`
- `push it`
- `deploy it`

Ambiguous responses do not approve:
- `looks ok`
- `nice`
- `seems fine`
- `continue`

Clear rejections include:
- `reject gate 2`
- `manual test failed`
- `this is wrong`
- `fix this`
- `the behavior is not correct`
- `not approved`

## Gate 2 Rejection Loop

On rejection, call:

```bash
node scripts/openspec-queue.mjs reject <change>
```

Then classify the feedback:
- If it is an implementation defect, fix the same candidate worktree, update tasks as needed, rerun verification, and present Gate 2 again.
- If it changes intended behavior, update the OpenSpec artifacts first, then fix the same candidate worktree, rerun verification, and present Gate 2 again.

Do not create a new change unless the user explicitly asks.

## Gate 2 Approval And Finalization

Only after strict Gate 2 approval, call:

```bash
node scripts/openspec-queue.mjs finalize <change> --confirm-gate2
node scripts/openspec-queue.mjs cleanup <change>
```

Why: finalization stops the server, uses the landing worktree, updates `main`, rebases when conflict-free, reruns setup and verification, preflights and archives OpenSpec, generates the squash commit message from the OpenSpec change, squash merges to `main`, pushes `main`, reconciles the planning checkout when safe, and marks the item finalized. Cleanup removes finalized resources and finalized candidate branches only when safe.

Safety boundary: never finalize without explicit Gate 2 approval. Archive failure stops merge and push. Never delete dirty worktrees, unrelated untracked files, or branches that are not patch-equivalent to `main`.

Expected result: `main` is pushed, Railway deploys from the pushed commit, and local queue resources are cleaned up when safe.

If normal finalization fails after Gate 2 approval, call:

```bash
node scripts/openspec-queue.mjs recover <change>
```

Present the recovery plan and risks. Only after explicit recovery approval that lists the planned sub-steps, call:

```bash
node scripts/openspec-queue.mjs recover-finalize <change> --confirm-recovery
```

Intentional merge/push without successful archive requires explicit partial-finalization recovery approval and must be labelled partial.

## Output Shape

During the run, keep the user oriented without making them operate the queue manually:

```text
Using /opsx:start route: <explore|propose|continue|existing-ready>
Reason: <short reason>

Design Gate Brief: <change>
...
Ready to build: yes/no

Waiting for Gate 1 approval.
```

After Gate 1 approval:

```text
Gate 1 approved. I am queueing and starting <change>, then building in the candidate worktree.
```

At Gate 2:

```text
Ready for manual testing: <change>
Branch: <branch>
Worktree: <path>
URL: <local URL or stopped-ready command>
Verification: <summary>

Waiting for Gate 2 approval or rejection.
```

## Guardrails

- Always route through explicit OpenSpec commands or existing OpenSpec artifacts.
- Never create queue runtime state before Gate 1 approval.
- Never approve Gate 1 or Gate 2 for the user.
- Continue from Gate 1 approval to Gate 2 without requiring another user command.
- Keep the candidate dev server running at Gate 2 when capacity permits.
- Preserve worktree state on rejection, conflict, verification failure, or push failure.
- Use lower-level queue commands directly only for status, recovery, or advanced operation.
