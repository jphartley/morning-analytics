## Context

The queue script currently discovers `repoRoot` from the current working directory. That is correct for ordinary repo operations, but wrong for queue state ownership: a candidate worktree has its own top-level path, so candidate commands can write `.openspec-queue/state.local.json` inside that worktree. The queue needs a stable planning checkout anchor while still running Git and npm commands in whichever worktree a command targets.

## Decisions

### Canonical Queue Root

Derive two roots:

- `currentWorktreeRoot`: `git rev-parse --show-toplevel` from the current command directory.
- `canonicalPlanningRoot`: the parent of `git rev-parse --path-format=absolute --git-common-dir` when that path ends in `.git`.

All queue-owned paths use `canonicalPlanningRoot`: config, state, worktree root, landing worktree, and logs. Worktree-sensitive operations still pass explicit `cwd` values.

### Split-State Recovery

Stop copying canonical state into candidate worktrees. Add detection for legacy candidate-local `.openspec-queue/state.local.json` files under known item worktrees, and add `recover-state <change> --confirm-recovery`.

Recovery imports only the requested item. It is allowed when canonical state is missing that item, or when canonical and candidate-local records point to the same branch and worktree and the candidate-local record is newer. Recovery does not silently merge all candidate state because that could overwrite unrelated queue state.

### Node Runtime Resolution

Queue-managed app commands resolve a command runner before invoking `npm` or starting the dev server:

- Direct execution is used only when the queue process major and `node` on `PATH` both match `app/.nvmrc`.
- If available, `fnm exec --using <major> ...` is used for npm and dev-server commands.
- If no compatible runtime can be selected, the queue fails before install, build, or serve mutation and prints the exact `fnm exec --using <major> ...` guidance.

`nvm` remains guidance-only because it is commonly a shell function, not a reliable subprocess executable.

### Touch Areas

Keep explicit path extraction from OpenSpec artifacts as the primary signal. Keyword inference remains for specific high-risk concepts, but generic words such as `auth`, `session`, and `dependency` no longer claim backend or package files by themselves.

### Draft Commits

`prepare-test` still makes candidate work durable after verification passes. If `HEAD` already has the exact message `Draft <change>`, rerunning `prepare-test` amends that commit instead of creating another draft. If there is no draft at `HEAD`, it creates one.

## Risks

- Canonical root detection assumes queue worktrees share the planning checkout's Git common dir. If a user copies a worktree outside that relationship, `doctor` should surface the resolved roots.
- Runtime selection adds command wrapping. Verification output must report the actual runner so failures remain understandable.
- Touch-area heuristics are intentionally conservative; explicit paths remain the way to force conflict detection for ambiguous changes.
