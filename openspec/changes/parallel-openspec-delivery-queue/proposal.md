## Why

OpenSpec already gives this project a strong specification workflow, but moving from an approved design through implementation, verification, manual testing, archive, commit, and push still requires too much serial attention. This change introduces a gated background delivery queue so the user can spend more time defining intent while approved changes move toward testable branches safely.

## What Changes

- Add a design approval gate based on a short Design Gate Brief before implementation begins.
- Add a FIFO queue for approved OpenSpec changes.
- Run queued changes in isolated Git worktrees with per-change branches.
- Support multiple queued worktrees with high-risk conflict detection.
- Produce local draft commits for implemented candidates.
- Start per-worktree dev servers on allocated ports for manual testing.
- Add a second manual test approval gate before archiving, squash merging into `main`, and pushing.
- Clean up worktrees and local runtime state after successful finalization.

## Capabilities

### New Capabilities
- `openspec-delivery-queue`: Gated background delivery workflow for OpenSpec changes using isolated worktrees, manual test handoffs, and final squash-to-main deployment.

### Modified Capabilities

## Impact

- Adds local workflow/tooling around OpenSpec, Git worktrees, branch management, dev server management, and queue state.
- Adds repo-local queue scripts as the portable source of truth, plus readable Codex/Claude/Cursor command or skill wrappers for orchestration.
- Does not change the user-facing application behavior directly.
- Does not introduce production infrastructure changes; Railway deployment continues to be triggered by pushes to `main`.
