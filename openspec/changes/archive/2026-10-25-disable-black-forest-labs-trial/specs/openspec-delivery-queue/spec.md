# Spec Delta

## MODIFIED Requirements

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

#### Scenario: Generated mock environment uses canonical image selection
- **WHEN** candidate bootstrap creates a placeholder environment
- **THEN** it SHALL set USE_AI_MOCKS=true and IMAGE_GENERATION_PROVIDER=mock
- **AND** it SHALL NOT generate the removed NEXT_PUBLIC_IMAGE_PROVIDER setting

#### Scenario: Canonical mock image mode is reported
- **WHEN** a candidate environment selects IMAGE_GENERATION_PROVIDER=mock
- **THEN** bootstrap SHALL recognize mock mode without relying on a legacy public provider setting
