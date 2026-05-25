## 1. Worktree Boundary And Config Preflights

- [x] 1.1 Add queue helpers that resolve the planning checkout, candidate worktree path, branch, and landing path consistently from config and queue state.
- [x] 1.2 Add a Builder preflight that verifies the current repo root, absolute candidate path, branch, and queue item worktree before implementation commands run.
- [x] 1.3 Add a post-build planning checkout contamination check that reports implementation edits, task edits, or candidate-only artifact edits outside the candidate worktree.
- [x] 1.4 Move the default candidate and landing worktree config to a gitignored repo-local writable location, or document and enforce the external writable-root requirement.
- [x] 1.5 Extend `doctor` and startup preflights to warn when worktree roots are outside the writable workspace or landing paths are not viable.

## 2. Candidate Bootstrap

- [x] 2.1 Add a queue-owned candidate setup step that runs before build, serve, prepare-test, or finalization verification.
- [x] 2.2 Install candidate dependencies with predictable `npm ci` behavior and remove shared binary or `node_modules` symlink assumptions from the happy path.
- [x] 2.3 Copy or link configured ignored local env files into the candidate worktree without printing secret values.
- [x] 2.4 Record and report candidate env mode as real local env, mock env, or placeholder env.
- [x] 2.5 Block auth or backend Gate 2 handoff when only placeholder Supabase or backend env values are active.

## 3. Dev Server Readiness

- [x] 3.1 Capture detached dev server stdout and stderr to a queue-owned log path.
- [x] 3.2 Add queue-owned readiness probing against `127.0.0.1` with bounded timeout and no raw `curl` dependency.
- [x] 3.3 Update `prepare-test` and `serve` to report reachable, stopped-by-capacity, or failed-with-log server states.
- [x] 3.4 Ensure Gate 2 handoff only presents a URL as ready when readiness probing succeeds.

## 4. Finalization And Recovery

- [x] 4.1 Add finalization landing preflight to `prepare-test` so landing blockers are surfaced before Gate 2 handoff.
- [x] 4.2 Fix landing behavior for repos where `main` is already checked out in the planning checkout.
- [x] 4.3 Keep normal archive, rebase, verification, squash merge, push, queue-state update, and cleanup readiness inside `finalize <change> --confirm-gate2`.
- [x] 4.4 Add a recovery finalization mode that reports current state, completed sub-steps, remaining sub-steps, risks, and the exact mutation plan.
- [x] 4.5 Require one explicit recovery approval before recovery mutates archive, rebase, merge, commit, push, queue state, or cleanup state.
- [x] 4.6 Ensure successful recovery updates `.openspec-queue/state.local.json` through the queue command without manual JSON editing.

## 5. Archive Flow

- [x] 5.1 Add archive preflight output showing candidate change path, spec sync/archive effects, archive destination, and non-interactive support.
- [x] 5.2 Run OpenSpec archive through queue-owned finalization or recovery commands rather than exposing direct destructive cleanup commands in normal assistant flow.
- [x] 5.3 Ensure active planning-checkout artifacts do not conflict with candidate archive state before final merge or cleanup.

## 6. Wrappers, Docs, And Validation

- [x] 6.1 Update `.agents/`, `.codex/`, and `.claude/` queue/start wrappers to describe the new preflight, setup, readiness, finalization, recovery, and archive boundaries.
- [x] 6.2 Update queue documentation and config comments or examples for repo-local worktree roots, env setup, readiness logs, and recovery approval language.
- [x] 6.3 Run `node scripts/openspec-queue.mjs doctor` and verify the new checks produce actionable output.
- [x] 6.4 Dry-run or exercise a queued candidate through start, setup, prepare-test, serve readiness, finalization preflight, recovery reporting, and cleanup safety.
- [x] 6.5 Run `cd app && npm run lint`, `cd app && npm run build`, and `openspec status --change queue-architecture-hardening`.
