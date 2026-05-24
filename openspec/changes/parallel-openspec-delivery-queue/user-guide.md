## Parallel OpenSpec Delivery Queue

### Why This Exists

This workflow exists to reduce the slow handoff between "the OpenSpec design is ready" and "there is a branch I can manually test." OpenSpec already does the important work of shaping intent through proposal, specs, design, and tasks. The queue adds orchestration around that workflow so approved changes can move through implementation, verification, local serving, finalization, and cleanup with less serial attention.

The goal is not to replace OpenSpec or let agents blindly build. The goal is to keep the user focused on the two moments where human judgment matters most:

1. Approving the design intent before implementation starts.
2. Manually testing the candidate before it is merged to `main` and deployed.

### How It Works

The workflow has two human gates.

#### Gate 1: Design Approval

OpenSpec remains the source of truth. A change is shaped through the normal OpenSpec artifacts:

- `proposal.md`
- `specs/**/spec.md`
- `design.md`
- `tasks.md`

The Intent Reviewer creates a short Design Gate Brief from those artifacts. The brief is for the user to read quickly. It highlights intent, UX or behavior changes, scope boundaries, risks, assumptions, manual test focus, and whether the system thinks the change is ready to build.

The queue does not start until the user explicitly approves Gate 1.

#### Background Delivery

After Gate 1 approval, the Queue Manager enqueues the change. Work runs outside the user's planning checkout so the user can keep working on the next OpenSpec change.

The queue uses three workspace roles:

- Planning checkout: the user's normal repo checkout for exploration and new OpenSpec work.
- Implementation worktree: one per approved change, used to build and serve the candidate.
- Landing worktree: a clean `main` worktree used only for final squash merge and push.

The Builder works in the candidate worktree. The Test Preparer verifies the candidate and starts a dev server on an allocated port when capacity permits.

#### Gate 2: Manual Test Approval

When a candidate is ready, the user receives a compact handoff:

- change name
- branch
- worktree path
- local URL
- changed behavior summary
- manual test focus
- verification result
- known risks
- approve or reject instructions

If manual testing fails, the existing OpenSpec change remains active, artifacts or tasks are updated as needed, and the same candidate flow repeats.

If manual testing passes, the Finalizer archives the OpenSpec change, squash merges into `main`, pushes `main`, and cleans up local resources. Railway deploys production from the pushed `main` commit.

### Agent Roles

#### Queue Manager

Owns the queue lifecycle. It records approvals, schedules approved changes FIFO, manages queue state, creates candidate and landing worktrees through scripts, and decides whether a change is waiting, active, ready for test, blocked, rejected, or finalized.

It may interrupt the user only for design ambiguity or high-risk queue conflicts.

#### Intent Reviewer

Creates the Design Gate Brief from the canonical OpenSpec artifacts. It reviews whether the intent is clear enough to build and surfaces ambiguity, scope creep, risks, assumptions, UX gaps, and technical escalations.

It does not approve Gate 1. Only the user does that.

#### Conflict Guard

Checks queued and active changes for risky overlap. It derives expected touched areas from the OpenSpec proposal, specs, design, and tasks, then compares those with active branches and changed files.

It allows low-risk overlap and pauses or sequences high-risk conflicts.

#### Builder

Implements the approved change inside the assigned candidate worktree. It invokes OpenSpec apply/context from inside that worktree, updates tasks as work completes, and creates draft commits.

It does not edit the planning checkout, archive OpenSpec, merge to `main`, push, or clean up the worktree.

#### Test Preparer

Runs verification, derives any change-specific automated checks from OpenSpec artifacts, allocates a port, starts the dev server when capacity permits, and prepares the manual test handoff.

Default verification from `app/`:

- `npm run lint`
- `npm run build`
- `npm run check:lockfile-registry` when `app/package-lock.json` changed

#### Finalizer

Runs only after Gate 2 approval. It stops the candidate dev server, uses the landing worktree, updates `main`, rebases the candidate branch when conflict-free, archives OpenSpec, creates the final squash commit, pushes `main`, and cleans up finalized local resources.

It pauses if the landing worktree is dirty, rebase conflicts appear, verification fails after rebase, or push fails.

### Script And Skill Model

Repo-local scripts are the portable source of truth. Skills and tool-specific commands are readable wrappers around those scripts.

The intended script entrypoint is:

```bash
node scripts/openspec-queue.mjs <command>
```

Expected commands:

- `status [<change>]`
- `doctor`
- `approve <change>`
- `start [<change>|--next]`
- `prepare-test <change>`
- `serve <change>`
- `stop <change>`
- `reject <change>`
- `finalize <change> --confirm-gate2`
- `cleanup <change>`
- `recover [<change>]`

Scripts own deterministic operations such as state transitions, worktree setup, artifact snapshotting, port/server management, verification, finalization, and cleanup. Scripts do not decide whether intent is good enough, approve human gates, or perform AI implementation.

Skills and commands should clearly explain which script they call, why they call it, what safety boundary it enforces, and what output or state transition to expect.

### Queue State

Shared queue configuration is committed:

```text
.openspec-queue/config.json
```

Machine-local runtime state is gitignored:

```text
.openspec-queue/state.local.json
```

This keeps the workflow portable across Codex, Claude Code, Cursor, and terminal usage while keeping local ports, process details, and worktree state out of Git history.

### How To Start Using It

1. Create or continue an OpenSpec change until proposal, specs, design, and tasks are ready.
2. Ask for an Intent Reviewer pass and read the Design Gate Brief.
3. Approve Gate 1 when the design intent is clear enough to build.
4. Let the Queue Manager enqueue and start the change.
5. Wait for the Test Preparer handoff with the local URL.
6. Manually test the candidate.
7. Reject Gate 2 if the behavior is wrong; the same OpenSpec change loops back for refinement.
8. Approve Gate 2 if the candidate is good; the Finalizer archives, squash merges, pushes `main`, and cleans up.

Start conservatively:

- one candidate worktree first
- one landing worktree
- then two active implementation jobs after the single-change lifecycle is reliable
- then multiple running dev servers only after port allocation and cleanup are stable
