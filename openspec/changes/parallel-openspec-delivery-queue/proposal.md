## Why

OpenSpec already gives this project a strong specification workflow, but moving from a rough idea to an approved design and then through implementation, verification, manual testing, archive, commit, and push still requires too much serial attention. This change introduces `/opsx:start` as the primary assisted delivery command: it routes the user through the right OpenSpec command, creates a Design Gate Brief, and after approval automatically drives the queued worktree flow to a candidate that is ready for manual testing.

## What Changes

- Add `/opsx:start` as the front-door command for taking a rough idea, detailed request, or existing OpenSpec change toward a Design Gate Brief.
- Route `/opsx:start` through explicit OpenSpec commands: `/opsx:explore`, `/opsx:propose`, and `/opsx:continue`.
- Add a design approval gate based on a short Design Gate Brief before implementation begins.
- Add a FIFO queue for approved OpenSpec changes.
- Automatically enqueue and start approved changes after Gate 1 approval.
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

- Adds local workflow/tooling around OpenSpec command orchestration, Git worktrees, branch management, dev server management, and queue state.
- Adds repo-local queue scripts as the portable source of truth, plus readable Codex/Claude/Cursor command or skill wrappers for orchestration.
- Adds a portable `openspec-start` skill and thin tool-specific adapters so Codex, Claude Code, Cursor, and terminal-oriented workflows can share the same delivery model.
- Does not change the user-facing application behavior directly.
- Does not introduce production infrastructure changes; Railway deployment continues to be triggered by pushes to `main`.
