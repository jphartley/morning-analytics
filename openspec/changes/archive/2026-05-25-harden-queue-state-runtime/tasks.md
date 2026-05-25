## 1. OpenSpec Artifacts

- [x] 1.1 Create proposal, design, delta specs, and tasks for `harden-queue-state-runtime`.

## 2. Canonical Queue State

- [x] 2.1 Split current worktree root from canonical planning root in `scripts/openspec-queue.mjs`.
- [x] 2.2 Anchor queue config, state, worktree root, landing worktree, and logs to the canonical planning root.
- [x] 2.3 Remove candidate state copying from normal queue commands.
- [x] 2.4 Report canonical state path and current worktree root in `doctor`.

## 3. Split-State Recovery

- [x] 3.1 Detect legacy candidate-local state files for known queue item worktrees.
- [x] 3.2 Add `recover-state <change> --confirm-recovery` with bounded import rules.
- [x] 3.3 Include split-state warnings in `doctor` and `recover`.

## 4. Node Runtime Selection

- [x] 4.1 Add a toolchain resolver for queue-managed app commands.
- [x] 4.2 Run npm and dev-server commands through direct Node 22 or `fnm exec --using 22`.
- [x] 4.3 Fail before app command mutation when Node 22 cannot be selected.
- [x] 4.4 Include runtime runner details in setup and verification output.

## 5. Workflow Polish

- [x] 5.1 Add missing `.agents/skills/openspec-propose/SKILL.md`.
- [x] 5.2 Tighten `expectedTouchAreas` keyword inference.
- [x] 5.3 Amend an existing `Draft <change>` commit during repeated `prepare-test` runs.

## 6. Validation

- [x] 6.1 Run queue `doctor --json` from planning and landing worktrees and confirm shared canonical state.
- [x] 6.2 Validate `recover-state` against a candidate-local legacy state fixture.
- [x] 6.3 Validate Node 22 runner metadata and fallback behavior.
- [x] 6.4 Validate frontend-only touch-area inference does not claim Supabase or package files.
- [x] 6.5 Verify repeated draft commit behavior.
- [x] 6.6 Run `npm run lint` and `npm run build` from `app/`.
