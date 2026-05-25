## Context

The previous queue hardening pass added several useful commands, but the second validation run showed that commands alone are not enough. The assistant can still edit from the planning checkout before `builder-preflight`, can run raw lint/build commands before setup, and can proceed after an OpenSpec archive abort if the queue script does not treat that abort as a hard blocker.

This change should focus on workflow enforcement. The queue should make the happy path harder to bypass and make partial or recovery states explicit. Items that did not recur in the second run are intentionally out of scope: writable-root noise, dev-server readiness reporting, the original `main` landing-worktree conflict, and manual JSON state recovery.

## Goals / Non-Goals

**Goals:**

- Require a visible, passing Builder preflight immediately before implementation edits.
- Make assistant-facing Builder instructions use absolute candidate paths for edits after queue start.
- Prevent raw candidate lint/build/serve/finalization verification before queue-owned setup.
- Ensure queue-managed Node/npm commands use the repo-pinned Node 22 runtime or fail before mutating.
- Separate OpenSpec telemetry/network noise from real command failure in queue logs.
- Stop finalization before merge/push when archive preflight or archive execution fails.
- Report finalization sub-step statuses clearly.
- Reconcile the planning checkout after detached landing push without deleting unrelated untracked files.
- Delete finalized candidate branches only after patch-equivalence and queue-state safety checks pass.

**Non-Goals:**

- Redesign worktree placement or writable-root configuration.
- Rework dev-server readiness behavior that already held in the second run.
- Change morning app product behavior.
- Automatically delete unrelated untracked files.
- Treat normal Git ancestry as sufficient proof that squash-merged branches are safe to delete.

## Decisions

### Enforce queue-owned command phases

The queue should model phases that commands can check: approved, started, builder-preflight-passed, setup-passed, verified, archived, merged, pushed, planning-synced, branch-cleaned. Wrapper text should describe the phases, but the script must be the source of truth where possible.

Alternative considered: rely on clearer assistant instructions. The second run showed that prose-only boundaries are too easy to bypass under tool pressure.

### Make setup a prerequisite for verification commands

`prepare-test`, `serve`, and `finalize` should call setup internally and should refuse to continue when setup fails. Documentation should avoid raw `npm run lint` and `npm run build` instructions for candidates except as implementation details of queue-managed verification.

The queue should detect the effective Node runtime before running `npm ci`, lint, build, or dev server commands. If the active runtime is not compatible with the app's Node 22 pin, the command should either use a configured Node 22 path or fail with a clear instruction.

Alternative considered: warn but continue under the current shell runtime. That produced Node 26 warnings and made verification less trustworthy.

### Treat archive as a required finalization gate

Finalization should preflight OpenSpec archive before merge/push by checking that touched main specs are structurally archiveable. During finalization, archive execution should have its own captured result. If archive fails, aborts, or reports no files changed unexpectedly, the queue must stop before squash merge and push.

If a user explicitly chooses partial finalization, that should be a separate recovery path with status clearly labelled as partial. It should not look like successful finalization.

Alternative considered: allow implementation to merge while archive is repaired later. That creates exactly the confusing state from the latest run: pushed implementation with active unarchived artifacts.

### Reconcile local planning state after detached landing push

Detached landing pushes leave the planning checkout behind. After successful push, the queue should report whether the planning checkout can fast-forward. It may perform a safe `git pull --ff-only` only when tracked state is clean enough. Unrelated untracked files must be preserved and reported.

Queue-created pre-Gate artifacts should be recorded when a change is approved or started so duplicate cleanup can target only those paths later.

Alternative considered: leave local reconciliation to the assistant. The run showed that this depends on memory and risks deleting the wrong untracked file.

### Clean finalized branches using patch-equivalence

Because queue finalization uses squash merges, normal `git branch --merged` cannot identify finalized candidate branches. Cleanup should use queue state plus patch-equivalence checks such as empty diff or `git cherry` equivalence before deleting local branches. Remote branch deletion should be even stricter and only run after local cleanup is safe and the branch is recorded as finalized.

Alternative considered: keep all candidate branches. That avoids deletion risk but lets stale `codex/*` branches accumulate after every successful run.

## Risks / Trade-offs

- Stricter phase checks may block manual recovery paths. Mitigation: provide explicit recovery commands that describe the partial state and required approval.
- Runtime enforcement can fail on machines without an obvious Node 22 path. Mitigation: fail early with the exact current version, required version, and setup instruction.
- Archive preflight may need to parse or invoke OpenSpec commands more than once. Mitigation: keep archive status output compact and cache the result in queue state.
- Branch cleanup has deletion risk. Mitigation: require finalized state, clean or removed worktree, successful push, and patch-equivalence before deletion.
