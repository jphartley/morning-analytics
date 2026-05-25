## Validation Scenarios

These scenarios capture the second-run failures that this change must prevent.

## 1. Builder Preflight Bypass

- Start a queued candidate and intentionally attempt to proceed to implementation without running `builder-preflight` from the candidate worktree.
- Expected: wrapper guidance and queue state require the preflight immediately before implementation edits.
- Expected: `prepare-test` blocks if the latest Builder preflight is missing, stale, or for a different worktree/branch.
- Expected: any planning-checkout implementation, task, or candidate artifact edits are reported as contamination.

## 2. Raw Verification Before Setup

- Use a fresh candidate worktree with no `app/node_modules`.
- Attempt raw candidate lint/build outside queue-managed setup.
- Expected: wrappers reject the raw path and route through `setup` or `prepare-test`.
- Expected: queue-managed setup reports dependency state, Node version, and env mode before verification.
- Expected: queue-managed npm commands fail before mutation if the active Node runtime is not the repo-pinned Node 22 runtime.

## 3. Archive Abort Before Merge

- Create or use a touched main spec whose requirements are structurally invalid, such as requirements outside `## Requirements`.
- Attempt `finalize <change> --confirm-gate2`.
- Expected: archive preflight fails before squash merge and push.
- Expected: archive, merge, and push statuses are separate, with merge and push not run after archive failure.
- Expected: any intentional partial finalization requires `--allow-partial-finalization --confirm-recovery` and is labelled partial.

## 4. Detached Landing Cleanup

- Finalize a candidate through a detached landing worktree.
- Expected: after push, the planning checkout reports whether it is behind `origin/main`.
- Expected: a clean planning checkout fast-forwards with `git pull --ff-only`.
- Expected: unrelated untracked files are preserved and reported.
- Expected: only recorded queue-created pre-Gate duplicate artifacts are removed.
- Expected: finalized candidate branches are removed only when patch-equivalent to `main` and owned by the queue item.
