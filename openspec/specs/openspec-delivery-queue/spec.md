# openspec-delivery-queue Specification

## Purpose
TBD - created by archiving change queue-architecture-hardening. Update Purpose after archive.
## Requirements
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

### Requirement: Canonical Queue State
The system SHALL store queue runtime state in one canonical planning-checkout location shared by planning, candidate, and landing worktree commands.

#### Scenario: Candidate command uses canonical state
- **WHEN** a queue command is run from a candidate worktree
- **THEN** the command reads and writes the same canonical `.openspec-queue/state.local.json` used by the planning checkout

#### Scenario: Queue paths use canonical root
- **WHEN** the queue resolves config, state, worktree, landing, or log paths
- **THEN** those paths are anchored to the canonical planning root rather than the command's current worktree root

#### Scenario: Doctor reports resolved roots
- **WHEN** `doctor` runs
- **THEN** it reports the current worktree root, canonical planning root, and canonical state path

### Requirement: Split Queue State Recovery
The system SHALL detect and explicitly recover from legacy candidate-local queue state without silently overwriting canonical queue state.

#### Scenario: Split state is detected
- **WHEN** a known candidate worktree contains a candidate-local `.openspec-queue/state.local.json`
- **THEN** `doctor` and `recover` report it as split-state warning

#### Scenario: Missing canonical item can be imported
- **WHEN** `recover-state <change> --confirm-recovery` is run and the canonical state is missing the change
- **THEN** the system imports only that change item from matching candidate-local state

#### Scenario: Newer matching item can replace canonical item
- **WHEN** canonical and candidate-local records have the same change, branch, and worktree path and the candidate-local record is newer
- **THEN** the system may replace the canonical item with the candidate-local item

#### Scenario: Unsafe split state is preserved
- **WHEN** candidate-local state does not match the requested change, branch, or worktree path
- **THEN** recovery refuses to import it and preserves both state files

### Requirement: Precise Expected Touch Areas
The system SHALL infer expected touch areas from explicit artifact paths and specific high-risk concepts without claiming broad unrelated areas for generic wording.

#### Scenario: Frontend-only change stays frontend-scoped
- **WHEN** OpenSpec artifacts describe a frontend-only UX change without explicit Supabase, package, or server-action paths
- **THEN** expected touch areas do not include Supabase paths or package files

#### Scenario: Explicit high-risk paths remain high-risk
- **WHEN** OpenSpec artifacts explicitly reference Supabase, package files, server actions, validation scripts, or OpenSpec specs
- **THEN** those areas remain included in expected touch areas for conflict detection

### Requirement: Idempotent Draft Commits
The system SHALL avoid accumulating repeated queue draft commits when `prepare-test` is rerun for the same candidate.

#### Scenario: Existing draft is amended
- **WHEN** verification passes and `HEAD` is already `Draft <change>`
- **THEN** the queue amends that draft commit instead of creating a new draft commit

#### Scenario: New draft is created when missing
- **WHEN** verification passes and `HEAD` is not `Draft <change>`
- **THEN** the queue creates a local `Draft <change>` commit when there are changes to commit

### Requirement: Portable Skill Parity
The system SHALL keep portable `.agents` OpenSpec queue skills aligned with the tool-specific skills required by `/opsx:start`.

#### Scenario: Portable propose skill exists
- **WHEN** `/opsx:start` routes detailed input to `/opsx:propose`
- **THEN** `.agents/skills/openspec-propose/SKILL.md` exists as the portable skill source

### Requirement: Candidate Setup Regression Gate
The system SHALL block candidate verification paths that bypass queue-managed setup.

#### Scenario: Raw verification is redirected
- **WHEN** a queue workflow is about to run candidate lint, build, serve, or finalization verification directly
- **THEN** the workflow SHALL route through `setup <change>`, `prepare-test <change>`, or another queue-owned setup path first

#### Scenario: Verification requires current setup
- **WHEN** queue-managed verification starts
- **THEN** the system SHALL verify setup completed successfully for the current candidate worktree and relevant setup inputs

#### Scenario: Setup failure blocks verification
- **WHEN** dependency install, Node runtime selection, or build env preparation fails
- **THEN** the system SHALL block verification and report the failed setup precondition instead of surfacing a later lint or build command-not-found failure

### Requirement: Main Spec Structure Finalization Preflight
The system SHALL validate touched main OpenSpec specs for archive-compatible structure before finalization can merge and push.

#### Scenario: Structurally invalid main spec blocks finalization
- **WHEN** finalization prepares to archive a candidate and a touched main spec is missing required OpenSpec structure
- **THEN** the system SHALL block merge and push, report the invalid spec path, and preserve the candidate for repair or recovery

#### Scenario: Archive blocker remains active
- **WHEN** archive fails because a main spec is structurally invalid
- **THEN** the completed candidate SHALL remain active or explicitly partial until the spec is repaired and archive succeeds

#### Scenario: Successful repair permits archive
- **WHEN** the blocking main spec structure is repaired without changing intended behavior
- **THEN** the queue SHALL allow archive to proceed and remove the completed active change through the normal archive path
