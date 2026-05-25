## ADDED Requirements

### Requirement: Queue Consumption Of App Readiness Contract

Queue candidate setup SHALL consume the documented app readiness contract before candidate verification starts.

#### Scenario: Missing dependencies are setup state
- **WHEN** a clean candidate worktree lacks `app/node_modules`
- **THEN** queue-facing verification SHALL treat that as setup state and run or require `npm ci` from `app/` before lint, build, serve, or finalization verification

#### Scenario: Build env is prepared before build
- **WHEN** candidate setup prepares an app worktree for build verification
- **THEN** it SHALL provide real, mock, or safe placeholder Supabase env values before `npm run build` starts

#### Scenario: Setup output reports readiness inputs
- **WHEN** candidate setup completes
- **THEN** it SHALL report dependency state, active Node version, and env mode before verification starts

#### Scenario: Placeholder env remains build-only
- **WHEN** setup uses safe placeholder Supabase values
- **THEN** queue-facing handoff SHALL identify the candidate as build/static-check ready but not auth/backend-test ready
