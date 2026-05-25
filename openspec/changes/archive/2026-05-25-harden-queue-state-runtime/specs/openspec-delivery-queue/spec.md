## ADDED Requirements

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
