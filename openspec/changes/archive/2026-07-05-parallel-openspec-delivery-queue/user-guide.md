## Parallel OpenSpec Delivery Queue

### Why This Exists

This workflow exists to reduce the slow handoff between "I have an idea" and "there is a branch I can manually test." OpenSpec already does the important work of shaping intent through proposal, specs, design, and tasks. The delivery system adds orchestration around that workflow so approved changes can move through implementation, verification, local serving, finalization, and cleanup with less serial attention.

The goal is not to replace OpenSpec or let agents blindly build. The goal is to keep the user focused on the two moments where human judgment matters most:

1. Approving the design intent before implementation starts.
2. Manually testing the candidate before it is merged to `main` and deployed.

### Primary Command

Use `/opsx:start` as the normal entrypoint:

```text
/opsx:start <idea, bug report, issue, or existing change>
```

`/opsx:start` is a harness around the explicit OpenSpec commands. It does not invent a separate requirements system.

It routes work like this:

- Fuzzy, short, speculative, or exploratory input -> `/opsx:explore`, then `/opsx:propose`
- Detailed request, bug report, issue, reproduction steps, or acceptance criteria -> `/opsx:propose`
- Existing active change with missing artifacts -> `/opsx:continue`
- Existing active change with apply-ready artifacts -> read the artifacts and create the Design Gate Brief

The destination is always a Design Gate Brief unless the exploration reaches a dead end or the user redirects the work.

### How It Works

The workflow has two human gates.

#### Gate 1: Design Approval

OpenSpec remains the source of truth. Before implementation starts, the change must have:

- `proposal.md`
- `specs/**/spec.md`
- `design.md`
- `tasks.md`

The Intent Reviewer creates a short Design Gate Brief from those artifacts. The brief is for the user to read quickly. It highlights intent, UX or behavior changes, scope boundaries, risks, assumptions, manual test focus, and whether the system thinks the change is ready to build.

Gate 1 uses strict natural-language approval. Clear approvals include:

- `approve gate 1`
- `approved`
- `approved, build it`
- `looks good, start building`
- `queue it`
- `start the build`

Casual replies such as `nice`, `ok`, `sounds good`, `interesting`, `continue`, or `maybe` do not approve the gate.

After Gate 1 approval, `/opsx:start` automatically enqueues and starts the work. You should not need a separate queue command on the happy path.

#### Background Delivery

After Gate 1 approval, the Queue Manager enqueues the change and starts the oldest eligible approved item. Work runs outside the user's planning checkout so the user can keep working on the next OpenSpec change.

The queue uses three workspace roles:

- Planning checkout: the user's normal repo checkout for exploration and new OpenSpec work.
- Implementation worktree: one per approved change, used to build and serve the candidate.
- Landing worktree: a clean `main` worktree used only for final squash merge and push.

The Builder works in the candidate worktree after `builder-preflight` verifies the absolute worktree path and branch immediately before implementation edits. The Test Preparer sets up dependencies and env, validates the repo-pinned Node runtime, verifies the candidate, checks finalization readiness, and starts a dev server on an allocated port when readiness succeeds and capacity permits.

#### Gate 2: Manual Test Approval

When a candidate is ready, `/opsx:start` keeps the dev server running when readiness succeeds and capacity permits and presents a compact handoff:

- change name
- branch
- worktree path
- local URL
- env mode
- server readiness state and log path when startup fails
- changed behavior summary
- manual test focus
- verification result
- known risks
- approve or reject instructions

Gate 2 also uses strict natural-language approval. Clear approvals include:

- `approve gate 2`
- `tested and approved`
- `manual test passed`
- `finalize it`
- `push it`
- `deploy it`

Casual replies such as `looks ok`, `nice`, `seems fine`, or `continue` do not approve finalization.

Clear rejections include:

- `reject gate 2`
- `manual test failed`
- `this is wrong`
- `fix this`
- `the behavior is not correct`
- `not approved`

If manual testing finds an implementation defect, the same candidate worktree is fixed and prepared for retesting. If manual testing changes the intended behavior, the OpenSpec artifacts are updated first, then the same candidate flow repeats.

If manual testing passes, the Finalizer archives the OpenSpec change, squash merges into `main`, pushes `main`, and cleans up local resources. Railway deploys production from the pushed `main` commit.

### Agent Roles

#### Intent Reviewer

Creates the Design Gate Brief from the canonical OpenSpec artifacts. It reviews whether the intent is clear enough to build and surfaces ambiguity, scope creep, risks, assumptions, UX gaps, and technical escalations.

It does not approve Gate 1. Only the user does that.

#### Queue Manager

Owns the queue lifecycle. It records approvals, schedules approved changes FIFO, manages queue state, creates candidate and landing worktrees through scripts, and decides whether a change is waiting, active, ready for test, blocked, rejected, or finalized.

It may interrupt the user only for design ambiguity or high-risk queue conflicts.

#### Conflict Guard

Checks queued and active changes for risky overlap. It derives expected touched areas from the OpenSpec proposal, specs, design, and tasks, then compares those with active branches and changed files.

It allows low-risk overlap and pauses or sequences high-risk conflicts.

#### Builder

Implements the approved change inside the assigned candidate worktree. It runs `builder-preflight` before editing, invokes OpenSpec apply/context from inside that worktree, updates tasks as work completes, and creates draft commits.

It does not edit the planning checkout, archive OpenSpec, merge to `main`, push, or clean up the worktree. Every implementation patch after queue start must target an absolute file path under the candidate worktree.

#### Test Preparer

Runs candidate setup, Node runtime validation, verification, planning-checkout contamination checks, landing preflight, and any change-specific automated checks from OpenSpec artifacts. It allocates a port, starts the dev server when capacity permits, probes `127.0.0.1` readiness through the queue script, captures logs, and prepares the manual test handoff.

Default verification is queue-managed from `app/`; do not run raw candidate lint/build outside `setup` or `prepare-test`:

- `npm run lint`
- `npm run build`
- `npm run check:lockfile-registry` when `app/package-lock.json` changed

#### Finalizer

Runs only after Gate 2 approval. It stops the candidate dev server, uses the detached landing worktree, updates from `origin/main`, rebases the candidate branch when conflict-free, reruns setup and verification, preflights and archives OpenSpec, creates the final squash commit, pushes `HEAD:main`, reconciles the planning checkout when safe, and cleans up finalized local resources.

It pauses if the landing worktree is dirty, rebase conflicts appear, verification fails after rebase, archive preflight or archive execution fails, or push fails. Archive failure stops before merge and push. If normal finalization cannot continue, `recover <change>` reports the bounded recovery plan and `recover-finalize <change> --confirm-recovery` runs it only after explicit recovery approval. Intentional merge/push without archive success must be labelled partial.

### OpenSpec Versus Agents

OpenSpec owns the meaning of the change:

- proposal
- specs
- design
- tasks
- apply/context guidance
- validation
- archive semantics

Agents own orchestration:

- routing `/opsx:start` to explicit OpenSpec commands
- summarizing the Design Gate Brief
- enforcing human gates
- running work in isolated worktrees
- detecting high-risk conflicts
- preparing manual testing handoffs
- finalizing approved work consistently

### Script And Skill Model

Repo-local scripts are the portable source of truth. Skills and tool-specific commands are readable wrappers around those scripts.

The canonical start workflow lives here:

```text
.agents/skills/openspec-start/SKILL.md
```

Thin adapters preserve the same workflow for different coding agents:

```text
.claude/commands/opsx/start.md
.claude/skills/openspec-start/SKILL.md
.codex/skills/openspec-start/SKILL.md
```

The lower-level queue script entrypoint is:

```bash
node scripts/openspec-queue.mjs <command>
```

Expected commands:

- `status [<change>]`
- `doctor`
- `approve <change>`
- `start [<change>|--next]`
- `builder-preflight <change>`
- `setup <change>`
- `prepare-test <change>`
- `serve <change>`
- `stop <change>`
- `reject <change>`
- `finalize <change> --confirm-gate2`
- `cleanup <change>`
- `recover [<change>]`
- `recover-finalize <change> --confirm-recovery`

These queue commands are primarily for the `/opsx:start` harness, recovery, status checks, and advanced operation. Scripts own deterministic operations such as state transitions, worktree setup, artifact snapshotting, dependency/env setup, Node runtime validation, port/server management, readiness probing, verification, finalization, archive, planning checkout reconciliation, finalized branch cleanup, and cleanup. Scripts do not decide whether intent is good enough, approve human gates, or perform AI implementation.

Skills and commands should clearly explain which script they call, why they call it, what safety boundary it enforces, and what output or state transition to expect.

### Queue State

Shared queue configuration is committed:

```text
.openspec-queue/config.json
```

The default worktree and log roots are repo-local and gitignored:

```text
.openspec-queue/worktrees/
.openspec-queue/logs/
```

Candidate setup copies configured ignored env files such as `app/.env.local` without printing values. If no local env is available, setup records placeholder mode; Gate 2 handoff must not claim auth or backend testing is ready while placeholder Supabase values are active. Queue-managed npm commands must run under the app's pinned Node major from `app/.nvmrc`.

This repair pass intentionally does not reopen non-recurring issues from the second validation run: repo-local writable-root noise, dev-server readiness reporting, the original `main` landing-worktree conflict, or manual queue-state JSON recovery.

Machine-local runtime state is gitignored:

```text
.openspec-queue/state.local.json
```

This keeps the workflow portable across Codex, Claude Code, Cursor, and terminal usage while keeping local ports, process details, and worktree state out of Git history.

### How To Start Using It

1. Run `/opsx:start <idea, bug report, issue, or existing change>`.
2. Review the Design Gate Brief.
3. Approve Gate 1 only when the design intent is clear enough to build.
4. Let `/opsx:start` automatically build, verify, and serve the candidate.
5. Manually test the local URL from the Gate 2 handoff.
6. Reject Gate 2 if the behavior is wrong; the same OpenSpec change loops back for refinement or fixes.
7. Approve Gate 2 if the candidate is good; the Finalizer archives, squash merges, pushes `main`, and cleans up.

Start conservatively:

- one `/opsx:start` thread first
- one candidate worktree first
- one landing worktree
- then two active implementation jobs after the single-change lifecycle is reliable
- then multiple running dev servers only after port allocation and cleanup are stable
