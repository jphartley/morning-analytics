# openspec-delivery-queue Specification

## Purpose
TBD - created by archiving change queue-architecture-hardening. Update Purpose after archive.
## Requirements
### Requirement: Builder Worktree Boundary Preflight
The system SHALL mechanically verify that Builder implementation work runs only in the assigned candidate worktree for the queued change.

#### Scenario: Builder starts from assigned worktree
- **WHEN** the Builder starts implementation for a queued change
- **THEN** the system verifies the current repo root, absolute path, branch, and queued worktree path match the queue item before any edit is made

#### Scenario: Builder instructions use absolute candidate paths
- **WHEN** the queue reports Builder instructions or examples
- **THEN** the system includes the absolute candidate worktree path and branch for the queued change

#### Scenario: Planning checkout remains unchanged by Builder
- **WHEN** implementation and build verification finish for a candidate
- **THEN** the system checks that the planning checkout did not receive implementation edits, task edits, or candidate-only OpenSpec artifact changes from the Builder

#### Scenario: Boundary failure blocks implementation
- **WHEN** the Builder preflight detects the wrong checkout, wrong branch, wrong worktree path, or planning-checkout contamination
- **THEN** the system blocks the queue item, preserves existing work, and reports the exact mismatch and recovery action

### Requirement: Writable Worktree Root Preflight
The system SHALL verify that queue worktree paths are compatible with the local writable workspace before normal queue operations require filesystem writes.

#### Scenario: Repo-local worktree root is accepted
- **WHEN** the configured candidate worktree root resolves inside a gitignored repo-local writable directory
- **THEN** `doctor` and queue startup preflights report the worktree root as writable for normal candidate setup, build, archive, and cleanup operations

#### Scenario: External worktree root is warned
- **WHEN** the configured candidate worktree root resolves outside the repo-local writable area
- **THEN** `doctor` reports that the root requires an explicit writable-root configuration or repeated approval for normal queue operations

#### Scenario: Queue commands own common filesystem mutations
- **WHEN** candidate setup, env preparation, archive, finalization, or cleanup requires routine queue filesystem changes
- **THEN** the system routes those changes through stable queue script commands rather than assistant-authored ad hoc shell sequences

### Requirement: Candidate Bootstrap
The system SHALL perform a first-class candidate setup step before candidate build, serve, or Gate 2 handoff.

#### Scenario: Dependencies are installed predictably
- **WHEN** a fresh candidate worktree needs app dependencies
- **THEN** the system installs dependencies with predictable `npm ci` behavior instead of relying on shared binaries or `node_modules` symlink shortcuts

#### Scenario: Local env files are prepared without leaking secrets
- **WHEN** ignored local env files are needed by a candidate worktree
- **THEN** the system copies or links the configured env files without printing secret values

#### Scenario: Env mode is reported
- **WHEN** candidate setup completes
- **THEN** the system records and reports whether the candidate uses real local env, mock env, or placeholder env

#### Scenario: Placeholder backend env blocks backend manual testing
- **WHEN** a candidate uses placeholder Supabase or backend env values
- **THEN** the system does not present auth or backend manual testing as ready for Gate 2 approval

### Requirement: Dev Server Readiness Handoff
The system SHALL verify local candidate server readiness before reporting a running Gate 2 URL.

#### Scenario: Server startup logs are captured
- **WHEN** the queue starts a detached candidate dev server
- **THEN** the system captures startup output and failures in a queue-owned log path

#### Scenario: Local readiness is probed by queue script
- **WHEN** `prepare-test` or `serve` starts or reuses a candidate dev server
- **THEN** the system probes `127.0.0.1` on the assigned port through queue-owned local readiness logic

#### Scenario: Reachable server is reported as ready
- **WHEN** the candidate URL responds successfully within the readiness timeout
- **THEN** the Gate 2 handoff reports the URL as reachable and includes the assigned port and process metadata

#### Scenario: Failed server is not reported as ready
- **WHEN** the candidate dev server exits, fails readiness, or never responds
- **THEN** the Gate 2 handoff reports a stopped or failed server state and includes the log path instead of presenting the URL as ready

### Requirement: Finalization Landing Preflight
The system SHALL detect finalization landing blockers before Gate 2 handoff.

#### Scenario: Landing strategy is checked before manual testing
- **WHEN** a candidate is prepared for Gate 2
- **THEN** the system verifies that the configured landing strategy can update `main`, rebase the candidate, archive OpenSpec, squash merge, and push after approval

#### Scenario: Main checked out in planning checkout is supported
- **WHEN** `main` is already checked out in the planning checkout
- **THEN** the system uses a supported landing strategy or reports that explicit recovery approval is required before Gate 2 can be considered fully ready

#### Scenario: Dirty landing state blocks handoff
- **WHEN** the landing worktree or approved planning-checkout landing path has uncommitted changes
- **THEN** the system blocks finalization readiness and reports the dirty files without deleting or overwriting them

### Requirement: Queue-Owned Recovery Finalization
The system SHALL provide a queue-supported recovery path for interrupted or failed finalization without requiring manual queue-state edits.

#### Scenario: Normal finalization owns all finalization sub-steps
- **WHEN** the user explicitly approves Gate 2 and invokes normal finalization
- **THEN** `finalize <change> --confirm-gate2` stops the server, prepares landing, rebases when safe, reruns verification, archives OpenSpec, squash merges, pushes `main`, updates queue state, and leaves cleanup ready

#### Scenario: Recovery reports bounded sub-steps
- **WHEN** normal finalization cannot continue
- **THEN** the recovery command reports the current queue state, branch, worktree, landing state, completed sub-steps, remaining sub-steps, and risks

#### Scenario: Recovery mutation requires explicit approval
- **WHEN** recovery mode would archive, rebase, merge, commit, push, update queue state, or clean up resources
- **THEN** the system requires one explicit recovery approval that lists all sub-steps before mutating state

#### Scenario: Queue state is updated by recovery command
- **WHEN** recovery finalization succeeds
- **THEN** the system updates `.openspec-queue/state.local.json` through the queue command and does not require manual JSON editing

### Requirement: Queue-Owned Archive Flow
The system SHALL run OpenSpec archive as a queue-owned finalization step with clear preflight and cleanup behavior.

#### Scenario: Archive preflight is reported
- **WHEN** finalization prepares to archive a candidate change
- **THEN** the system reports the candidate change path, spec changes to be synced, expected archive destination, and whether the command can run non-interactively

#### Scenario: Archive avoids direct destructive assistant commands
- **WHEN** archive cleanup requires removing active artifacts or duplicate files
- **THEN** the system performs cleanup through the queue-owned archive/finalization command instead of exposing direct `rm -rf` commands in normal assistant flow

#### Scenario: Planning checkout artifacts do not conflict
- **WHEN** the candidate archive completes
- **THEN** the system ensures active planning-checkout artifacts do not conflict with the archived candidate state before final merge or cleanup

### Requirement: Verification Scope Policy
The system SHALL distinguish candidate-caused verification failures from unrelated baseline failures before queued candidate scope is expanded.

#### Scenario: Candidate-caused failure is fixed in candidate
- **WHEN** lint, build, or readiness verification fails because of files or behavior changed by the candidate
- **THEN** the Builder SHALL fix the failure inside the candidate worktree before Gate 2 handoff or finalization

#### Scenario: Unrelated baseline failure stops candidate expansion
- **WHEN** lint, build, or readiness verification fails because of an issue that predates or is unrelated to the candidate
- **THEN** the queue workflow SHALL stop candidate expansion and report the baseline failure separately from the candidate work

#### Scenario: Explicit approval can expand scope
- **WHEN** the user explicitly approves including unrelated baseline cleanup in the current candidate
- **THEN** the workflow MAY include that cleanup and SHALL record that scope expansion in the candidate summary or task notes

#### Scenario: Dedicated hygiene change remains preferred
- **WHEN** unrelated baseline failures are substantial, risky, or outside the approved feature behavior
- **THEN** the workflow SHALL recommend a dedicated hygiene change before resuming feature candidate finalization
