## Context

The queue currently has the right high-level model: OpenSpec owns intent, the queue scripts own deterministic workflow steps, and candidates are built in separate worktrees before Gate 2. The first real run showed that several important boundaries are still conventions rather than enforced checks.

The most visible failures were implementation edits landing in the planning checkout, candidate worktrees living outside the writable workspace, fresh candidates lacking dependencies or reliable local env, Gate 2 handoff reporting a server before readiness was proven, finalization failing when `main` was already checked out elsewhere, and recovery requiring manual queue-state edits. These are queue architecture problems rather than morning app product problems.

## Goals / Non-Goals

**Goals:**

- Mechanically verify that Builder work starts in the assigned candidate worktree.
- Make worktree root writability and sandbox expectations visible before queue work starts.
- Bootstrap candidate dependencies and env through a first-class queue-owned step.
- Present Gate 2 only when candidate verification and server readiness are known.
- Detect finalization landing blockers before Gate 2 handoff.
- Keep archive, recovery finalization, queue state updates, and cleanup inside queue commands.
- Update queue wrapper skills and docs so assistants use stable script commands instead of ad hoc shell sequences.

**Non-Goals:**

- Change the morning app runtime, UI, or production behavior.
- Replace OpenSpec artifact generation, validation, or archive semantics.
- Add real parallel worker orchestration beyond the existing local queue model.
- Automatically approve Gate 1 or Gate 2.
- Delete dirty worktrees or hide destructive state transitions.

## Decisions

### Add queue preflights as reusable script checks

The queue script should expose reusable checks that run from the commands that need them instead of relying on wrapper prose. The same underlying checks can serve `doctor`, `start`, `prepare-test`, `serve`, `finalize`, and recovery flows.

Core preflights:

- Current repo root matches the expected planning checkout for planning commands.
- Builder-only commands are being run from the assigned absolute candidate worktree path.
- Candidate branch and worktree path match the queue item.
- Planning checkout has not received implementation or task edits after Builder work.
- Configured worktree root and landing worktree are inside a writable repo-local area or are explicitly reported as requiring sandbox approval.
- Landing strategy is viable before Gate 2 handoff.

Alternative considered: keep these as assistant instructions only. That failed during the first real run because the assistant could accidentally edit the wrong checkout and only recover later.

### Prefer repo-local ignored worktrees unless configuration says otherwise

The default queue worktree root should move to a gitignored repo-local directory such as `.openspec-queue/worktrees/` or another repo-local ignored path. A sibling root can still be supported, but `doctor` should warn when it is outside the known writable workspace and explain the required writable-root configuration.

Alternative considered: keep the sibling worktree root and rely on repeated approvals. That makes normal queue operations feel exceptional and increases the chance that a run fragments into manual recovery steps.

### Make candidate setup an explicit queue phase

Candidate setup should run before build, serve, or Gate 2. It should install dependencies predictably with `npm ci`, copy or link ignored local env files without printing secret values, and record whether the candidate is using real local env, mock env, or placeholder env.

Placeholder Supabase values can be enough for some static build verification, but they are not enough for auth or backend manual testing. The handoff must make that distinction explicit and block auth/backend Gate 2 handoff when only placeholders are active.

Alternative considered: symlink `node_modules` or invoke a shared Next binary. Those shortcuts are fast but brittle, hide stale dependency state, and created confusing failures during the first run.

### Treat dev server readiness as queue-owned state

Server startup should write logs to a queue-owned runtime path and readiness should be checked by the queue script using Node's local HTTP APIs against `127.0.0.1`. `prepare-test` and `serve` should report one of three states: reachable, stopped by capacity policy, or failed with a log path.

Alternative considered: report PID and URL immediately after spawning. That is insufficient because the process can fail after spawn while the handoff still looks ready.

### Preflight finalization before Gate 2 handoff

`prepare-test` should check whether finalization has an available landing strategy before asking the user to spend time on manual testing. If the configured landing worktree cannot be created because `main` is checked out in the planning checkout, the queue should use an explicit supported strategy: reuse the clean planning checkout only with user approval, use a detached landing worktree, or create a dedicated landing branch/worktree layout that Git permits.

Alternative considered: discover landing problems only after Gate 2 approval. That delays a known blocker until the riskiest point in the workflow.

### Add one recovery finalization command

Normal finalization should keep archive, rebase, verification, squash merge, push, queue-state update, and cleanup inside `finalize <change> --confirm-gate2`. If normal finalization cannot proceed, a queue-supported recovery command should print the exact state and require one explicit recovery approval before performing a bounded set of recovery sub-steps.

Alternative considered: keep recovery as printed suggestions. Suggestions are useful for diagnosis, but the first run showed that successful recovery should not require manual JSON edits or a sequence of separately approved shell operations.

## Risks / Trade-offs

- Stricter preflights can block a queue item that a human could manually push through. Mitigation: make failures actionable and provide recovery commands that preserve work.
- Repo-local worktrees can increase the size of the working directory. Mitigation: keep the root gitignored and make cleanup report finalized resources clearly.
- `npm ci` for each candidate is slower than symlinking dependencies. Mitigation: prefer predictable correctness for queued delivery, and allow future cache optimization only after the setup contract is stable.
- Env copying must avoid leaking secrets in logs. Mitigation: report file names and env mode only, never secret values.
- Readiness polling can introduce delays. Mitigation: use short bounded timeouts and include the server log path when readiness fails.
