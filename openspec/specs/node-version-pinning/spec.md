## Purpose

Ensure consistent Node.js version across local development and cloud deployment environments.

## Requirements

### Requirement: Project-level Node version pin

The project SHALL declare Node.js 22 LTS as the required runtime version via a `.nvmrc` file at the project root containing `22`.

#### Scenario: Version manager reads .nvmrc
- **WHEN** a developer uses fnm, nvm, or another .nvmrc-compatible version manager
- **THEN** the tool SHALL select or prompt for Node 22.x

#### Scenario: Nixpacks reads .nvmrc
- **WHEN** Railway deploys the app using Nixpacks
- **THEN** Nixpacks SHALL use Node 22.x as the build and runtime version

### Requirement: Package-level engine constraint

The `/app/package.json` SHALL declare `"engines": { "node": "22.x" }` to constrain the Node.js version.

#### Scenario: npm warns on wrong Node version
- **WHEN** a developer runs `npm install` with a Node version outside 22.x
- **THEN** npm SHALL display a warning about the engine mismatch

#### Scenario: Railway reads engines field
- **WHEN** Railway's Nixpacks detects the `engines.node` field
- **THEN** it SHALL use Node 22.x for the deployment environment

### Requirement: Candidate Verification Runtime

Candidate verification commands SHALL run under the repo-pinned Node 22 runtime.

#### Scenario: Queue command selects Node 22
- **WHEN** queue-managed setup, lint, build, serve, or finalization verification invokes npm for the app
- **THEN** the command SHALL use Node 22.x selected from the repo runtime pin when a compatible local runtime is available

#### Scenario: Wrong Node fails before mutation
- **WHEN** the active runtime is outside Node 22.x and the queue cannot select a compatible local runtime
- **THEN** candidate setup SHALL fail before dependency install, build, or serve mutation and report the current version, required version, and setup instruction

#### Scenario: Runtime is visible in setup output
- **WHEN** candidate setup prepares or verifies dependencies
- **THEN** the output SHALL include the active Node version used for npm commands

#### Scenario: Runtime pins remain aligned
- **WHEN** the app runtime pin changes
- **THEN** `app/.nvmrc`, `app/package.json`, and `app/package-lock.json` SHALL remain aligned before candidate verification is considered ready
