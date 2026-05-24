## ADDED Requirements

### Requirement: Design Gate Brief
The system SHALL generate a compact Design Gate Brief for an OpenSpec change before queueing implementation.

#### Scenario: Brief highlights intent and risk
- **WHEN** an OpenSpec change has enough proposal, spec, and design detail to evaluate implementation readiness
- **THEN** the system presents a brief containing intent, UX or behavior changes, scope boundaries, key risks and assumptions, technical escalations, manual test focus, and a ready-to-build recommendation

#### Scenario: User approval is required
- **WHEN** the system recommends that a change is ready to build
- **THEN** the change is not queued until the user explicitly approves the Design Gate Brief

#### Scenario: Fuzzy intent loops back
- **WHEN** the brief identifies unclear product behavior, missing UX behavior, unbounded scope, important edge cases, or significant unreviewed technical escalation
- **THEN** the system keeps the change out of the implementation queue and routes the work back to artifact refinement

### Requirement: FIFO Delivery Queue
The system SHALL queue approved OpenSpec changes in first-in, first-out order.

#### Scenario: Scripts provide portable behavior
- **WHEN** queue behavior is implemented
- **THEN** the system provides repo-local scripts that can be used from Codex, Claude Code, Cursor, or a terminal

#### Scenario: Script command surface is stable
- **WHEN** the queue scripts are installed
- **THEN** the system provides commands for status, doctor, approve, start, prepare-test, serve, stop, reject, finalize, cleanup, and recover operations

#### Scenario: Scripts do not decide human gates
- **WHEN** a script records Gate 1 approval or performs Gate 2 finalization
- **THEN** it acts only on explicit user-supplied approval and does not decide readiness itself

#### Scenario: Scripts support assistant and human use
- **WHEN** a queue script command runs
- **THEN** it provides human-readable output by default and machine-readable `--json` output for assistant wrappers

#### Scenario: Dangerous script actions are explicit
- **WHEN** a queue script command pushes, deletes, stops servers, cleans up worktrees, or finalizes a candidate
- **THEN** it explicitly states the state transition being performed and requires the appropriate approval or finalized state

#### Scenario: Skills describe script orchestration
- **WHEN** a tool-specific skill or command wraps queue scripts
- **THEN** it states the role it represents, which scripts it calls, why those scripts are called, what safety boundary they enforce, and what output or state transition to expect

#### Scenario: Shared queue configuration is portable
- **WHEN** queue defaults are configured
- **THEN** the system stores portable workflow defaults in committed `.openspec-queue/config.json`

#### Scenario: Runtime state is local
- **WHEN** queue runtime state is recorded
- **THEN** the system stores machine-local status, worktree paths, ports, process details, and verification results in gitignored `.openspec-queue/state.local.json`

#### Scenario: Oldest approved change starts first
- **WHEN** multiple changes have passed the design gate and execution capacity is available
- **THEN** the oldest approved queued change starts before later approved changes unless a high-risk conflict blocks it

#### Scenario: Background work is quiet
- **WHEN** a queued change is being implemented in the background
- **THEN** the system does not interrupt the user unless design ambiguity or a high-risk queue conflict is discovered

### Requirement: Worktree Isolation
The system SHALL implement each queued change in an isolated Git worktree and branch.

#### Scenario: Worktree is created for an approved change
- **WHEN** an approved queued change starts implementation
- **THEN** the system creates or reuses a dedicated branch and Git worktree for that change

#### Scenario: OpenSpec artifacts travel with implementation
- **WHEN** a change is implemented in its worktree
- **THEN** the branch contains both the OpenSpec change artifacts and the code changes needed for that change

#### Scenario: Approved artifacts are snapshotted before implementation
- **WHEN** the user approves the Design Gate Brief
- **THEN** the system snapshots the approved OpenSpec artifacts into the candidate branch before the Builder starts implementation

#### Scenario: Builder uses candidate artifact context
- **WHEN** the Builder starts implementation
- **THEN** it invokes OpenSpec apply/context from inside the candidate worktree

#### Scenario: Draft commit preserves candidate state
- **WHEN** implementation and automated verification reach a candidate result
- **THEN** the system creates a local draft commit on the change branch before presenting it for manual testing

#### Scenario: Planning checkout remains available
- **WHEN** queued work is being implemented or finalized
- **THEN** the system uses implementation and landing worktrees so the user's planning checkout can continue holding unrelated OpenSpec exploration or artifact edits

### Requirement: Parallel Conflict Detection
The system SHALL allow parallel worktrees while blocking only high-risk conflicts.

#### Scenario: Low-risk overlap continues
- **WHEN** two queued changes overlap only in low-risk areas such as unrelated documentation, unrelated styling, or separate components
- **THEN** the system records or reports the overlap without blocking parallel implementation

#### Scenario: High-risk overlap blocks or sequences work
- **WHEN** two queued changes touch the same component behavior, server action, Supabase schema or RLS policy, package or lockfile dependency, auth or session code, deployment-sensitive configuration, or the same OpenSpec spec
- **THEN** the system pauses or sequences the later change and surfaces the conflict to the user

### Requirement: Manual Testing Handoff
The system SHALL hand off completed candidates with a running dev server when practical.

#### Scenario: Default automated verification runs
- **WHEN** a candidate is prepared for manual testing
- **THEN** the system runs `npm run lint` and `npm run build` from `app/`

#### Scenario: Lockfile registry check runs when needed
- **WHEN** `app/package-lock.json` changed in the candidate branch
- **THEN** the system runs `npm run check:lockfile-registry` from `app/`

#### Scenario: Change-specific verification is derived from artifacts
- **WHEN** an OpenSpec change touches validation scripts, integrations, Supabase behavior, image generation, or AI output parsing
- **THEN** the Test Preparer derives any additional automated verification from the OpenSpec proposal, specs, design, and tasks

#### Scenario: Candidate receives a unique port
- **WHEN** a worktree is ready for manual testing
- **THEN** the system assigns a unique local port and starts the app dev server from that worktree when capacity permits

#### Scenario: Handoff is compact and actionable
- **WHEN** the system reports that a candidate is ready for manual testing
- **THEN** it includes the change name, branch, worktree path, local URL, changed behavior summary, manual test focus, verification result, known risks, and Gate 2 approval or rejection instructions

#### Scenario: Dev server capacity is limited
- **WHEN** more candidates are ready than the configured number of running dev servers
- **THEN** the system keeps excess candidates ready but stopped and provides the command or action needed to start them

### Requirement: Manual Test Gate
The system SHALL wait for user approval after manual testing before finalizing a change.

#### Scenario: Approval finalizes the change
- **WHEN** the user approves the manual test gate for a candidate
- **THEN** the system uses a clean landing worktree to update main from origin, rebases the candidate branch onto current main if conflict-free, reruns required verification, archives the OpenSpec change, squash merges the result into main, pushes main, and cleans up the candidate worktree

#### Scenario: Failed manual test loops back
- **WHEN** the user rejects the manual test gate or reports a defect
- **THEN** the system keeps the existing OpenSpec change active, updates the relevant artifacts or tasks when needed, fixes the same worktree, and prepares a new candidate for retesting

#### Scenario: Main has moved
- **WHEN** main has changed before finalization
- **THEN** the system updates the landing worktree automatically, rebases the candidate branch if conflict-free, asks the user only when conflicts appear, and reruns verification before merging

### Requirement: Cleanup and Safety
The system SHALL clean up successful queue items without deleting useful work.

#### Scenario: Successful finalization cleans local resources
- **WHEN** a candidate has been archived, squash merged into main, and pushed successfully
- **THEN** the system stops the candidate dev server, removes the worktree, clears local queue runtime state, and reports the deployed commit

#### Scenario: Failed finalization preserves work
- **WHEN** finalization fails due to conflicts, verification failure, push failure, or another unrecovered error
- **THEN** the system keeps the worktree and branch intact and reports the exact recovery state

#### Scenario: Dirty worktree is not deleted
- **WHEN** cleanup is requested for a worktree with uncommitted changes
- **THEN** the system refuses automatic deletion and reports the files that require attention
