## MODIFIED Requirements

### Requirement: Candidate Verification Runtime

Candidate verification commands SHALL run under the repo-pinned Node 22 runtime.

#### Scenario: Queue command selects Node 22
- **WHEN** queue-managed setup, lint, build, serve, or finalization verification invokes npm for the app
- **THEN** the command SHALL use Node 22.x selected from the repo runtime pin when a compatible local runtime is available

#### Scenario: Child command selects Node 22 despite queue launch runtime
- **WHEN** the queue script itself was launched from a non-22 Node runtime but a compatible Node 22 runtime is available through the local toolchain
- **THEN** queue-managed npm and dev-server child commands SHALL run through that Node 22 runtime

#### Scenario: Wrong Node fails before mutation
- **WHEN** the active runtime is outside Node 22.x and the queue cannot select a compatible local runtime
- **THEN** candidate setup SHALL fail before dependency install, build, or serve mutation and report the current version, required version, and setup instruction

#### Scenario: Runtime is visible in setup output
- **WHEN** candidate setup prepares or verifies dependencies
- **THEN** the output SHALL include the active Node version and command runner used for npm commands

#### Scenario: Runtime pins remain aligned
- **WHEN** the app runtime pin changes
- **THEN** `app/.nvmrc`, `app/package.json`, and `app/package-lock.json` SHALL remain aligned before candidate verification is considered ready
