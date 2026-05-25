## MODIFIED Requirements

### Requirement: Builder Worktree Boundary Preflight
The system SHALL mechanically verify and enforce that Builder implementation work runs only in the assigned candidate worktree for the queued change.

#### Scenario: Builder starts from assigned worktree
- **WHEN** the Builder starts implementation for a queued change
- **THEN** the system verifies the current repo root, absolute path, branch, and queued worktree path match the queue item before any edit is made

#### Scenario: Builder preflight is immediately before edits
- **WHEN** the assistant is about to make the first implementation edit after queue start
- **THEN** `builder-preflight <change>` MUST be the immediately preceding queue step and MUST have passed for the same candidate worktree path

#### Scenario: Builder instructions use absolute candidate paths
- **WHEN** the queue reports Builder instructions or examples
- **THEN** the system includes the absolute candidate worktree path and branch for the queued change
- **AND** the instructions state that every implementation patch path must be under that absolute candidate worktree path

#### Scenario: Planning checkout remains unchanged by Builder
- **WHEN** implementation and build verification finish for a candidate
- **THEN** the system checks that the planning checkout did not receive implementation edits, task edits, or candidate-only OpenSpec artifact changes from the Builder

#### Scenario: Boundary failure blocks implementation
- **WHEN** the Builder preflight detects the wrong checkout, wrong branch, wrong worktree path, missing recent preflight, or planning-checkout contamination
- **THEN** the system blocks the queue item, preserves existing work, and reports the exact mismatch and recovery action

### Requirement: Candidate Bootstrap
The system SHALL perform and enforce a first-class candidate setup step before candidate lint, build, serve, or finalization verification.

#### Scenario: Setup gates verification
- **WHEN** a queue command is about to run candidate lint, build, serve, or finalization verification
- **THEN** the system verifies setup has completed successfully for the current candidate branch and worktree state

#### Scenario: Raw verification path is rejected
- **WHEN** the workflow attempts to verify a candidate with raw `npm run lint`, `npm run build`, or dev-server commands outside queue-managed setup
- **THEN** the queue wrapper instructions reject that path and route the workflow through `setup <change>` or `prepare-test <change>`

#### Scenario: Dependencies are installed predictably
- **WHEN** a fresh candidate worktree needs app dependencies
- **THEN** the system installs dependencies with predictable `npm ci` behavior instead of relying on shared binaries or `node_modules` symlink shortcuts

#### Scenario: Node runtime is enforced
- **WHEN** the queue runs `npm ci`, lint, build, or dev server commands for the app
- **THEN** the system uses the repo-pinned Node 22 runtime or fails before running the command with the current Node version, required Node version, and setup instruction

#### Scenario: Local env files are prepared without leaking secrets
- **WHEN** ignored local env files are needed by a candidate worktree
- **THEN** the system copies or links the configured env files without printing secret values

#### Scenario: Env mode and dependency state are reported together
- **WHEN** candidate setup completes
- **THEN** the system records and reports dependency state, Node version, and whether the candidate uses real local env, mock env, or placeholder env before verification starts

#### Scenario: Placeholder backend env blocks backend manual testing
- **WHEN** a candidate uses placeholder Supabase or backend env values
- **THEN** the system does not present auth or backend manual testing as ready for Gate 2 approval

### Requirement: Queue-Owned Archive Flow
The system SHALL run OpenSpec archive as a required queue-owned finalization gate with clear preflight, execution status, and cleanup behavior.

#### Scenario: Archive preflight validates main specs
- **WHEN** finalization prepares to archive a candidate change
- **THEN** the system validates touched main specs are structurally compatible with OpenSpec archive before squash merge or push

#### Scenario: Archive preflight is reported
- **WHEN** finalization prepares to archive a candidate change
- **THEN** the system reports the candidate change path, spec changes to be synced, expected archive destination, whether the command can run non-interactively, and any main-spec structural blockers

#### Scenario: Archive failure blocks merge and push
- **WHEN** OpenSpec archive fails, aborts, or reports that no files changed unexpectedly
- **THEN** the system stops finalization before squash merge and push, marks the queue item blocked, and reports archive status separately from merge and push status

#### Scenario: Partial finalization requires recovery approval
- **WHEN** the queue would intentionally merge or push without a successful archive
- **THEN** the system requires explicit partial-finalization recovery approval and labels the result as partial rather than finalized

#### Scenario: Archive avoids direct destructive assistant commands
- **WHEN** archive cleanup requires removing active artifacts or duplicate files
- **THEN** the system performs cleanup through the queue-owned archive/finalization command instead of exposing direct `rm -rf` commands in normal assistant flow

#### Scenario: Planning checkout artifacts do not conflict
- **WHEN** the candidate archive completes
- **THEN** the system ensures active planning-checkout artifacts do not conflict with the archived candidate state before final merge or cleanup

## ADDED Requirements

### Requirement: OpenSpec Command Telemetry Handling
The system SHALL keep known OpenSpec telemetry or network warning noise separate from OpenSpec command success or failure.

#### Scenario: Telemetry warning with successful command
- **WHEN** an OpenSpec command exits successfully but prints telemetry or `edge.openspec.dev` network warnings
- **THEN** the queue reports the command as successful and classifies the telemetry warning as non-blocking noise

#### Scenario: OpenSpec command failure remains blocking
- **WHEN** an OpenSpec command exits unsuccessfully or fails to produce required output
- **THEN** the queue treats the OpenSpec command as failed even if telemetry warnings are also present

#### Scenario: Telemetry suppression is configured
- **WHEN** OpenSpec supports disabling telemetry through environment variables or CLI configuration
- **THEN** queue-managed OpenSpec commands run with telemetry disabled

### Requirement: Finalization Step Status Reporting
The system SHALL report finalization as distinct archive, merge, push, planning-sync, worktree-cleanup, and branch-cleanup statuses.

#### Scenario: Successful finalization reports all sub-steps
- **WHEN** finalization succeeds
- **THEN** the system reports archive, merge, push, planning-sync, worktree-cleanup, and branch-cleanup statuses separately

#### Scenario: Failed sub-step stops later unsafe sub-steps
- **WHEN** a required finalization sub-step fails
- **THEN** the system does not run later unsafe sub-steps and reports the item state needed for recovery

### Requirement: Planning Checkout Reconciliation
The system SHALL reconcile the planning checkout after a successful detached landing push without deleting unrelated user files.

#### Scenario: Planning checkout behind origin is reported
- **WHEN** finalization pushes `main` from a detached landing worktree
- **THEN** the system reports whether the planning checkout is behind `origin/main`

#### Scenario: Clean planning checkout fast-forwards
- **WHEN** the planning checkout can safely fast-forward with no tracked conflicts
- **THEN** the system performs or offers a `git pull --ff-only` and reports the result

#### Scenario: Unrelated untracked files are preserved
- **WHEN** the planning checkout contains unrelated untracked files
- **THEN** the system preserves those files and reports them separately as local state

#### Scenario: Queue-created pre-Gate artifacts are tracked
- **WHEN** queue approval or start snapshots a change that also exists in the planning checkout
- **THEN** the system records the queue-created pre-Gate artifact paths so later duplicate cleanup can target only those files

#### Scenario: Duplicate queue artifacts are cleaned precisely
- **WHEN** finalization leaves duplicate queue-created active artifacts in the planning checkout
- **THEN** the system removes or offers to remove only the recorded queue-created duplicates and never removes unrelated untracked files

### Requirement: Finalized Candidate Branch Cleanup
The system SHALL clean up finalized candidate branches after successful queue finalization when branch content is safely represented on `main`.

#### Scenario: Local candidate branch is deleted after safe finalization
- **WHEN** finalization has archived, merged, pushed `main`, and cleaned or removed the candidate worktree
- **THEN** the system deletes the local candidate branch only if its tip is patch-equivalent to `main` or recorded as finalized in queue state

#### Scenario: Squash merge ancestry is not required
- **WHEN** a candidate branch was squash-merged and therefore does not appear merged by Git ancestry
- **THEN** the system uses patch-equivalence checks instead of relying only on `git branch --merged`

#### Scenario: Remote branch deletion is stricter
- **WHEN** a remote candidate branch exists
- **THEN** the system deletes it only after successful `main` push, local branch safety checks, and explicit queue-state evidence that the branch belongs to the finalized item

#### Scenario: Unsafe branch is preserved
- **WHEN** branch cleanup cannot prove patch-equivalence or finalized queue ownership
- **THEN** the system preserves the branch and reports why cleanup was skipped
