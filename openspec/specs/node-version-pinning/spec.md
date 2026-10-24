## Purpose

Ensure consistent Node.js version across local development and cloud deployment environments.

## Requirements

### Requirement: Project-level Node version pin

The project SHALL require Node.js 22 LTS at version 22.23.4 or later within
22.x. The repository-root and app-level `.nvmrc` files SHALL both select `22`,
allowing the latest available stable release in that line. The package engine
constraint SHALL provide the explicit security minimum.

#### Scenario: Version manager reads .nvmrc
- **WHEN** a developer uses fnm, nvm, or another .nvmrc-compatible version manager from the repository root or app directory
- **THEN** the tool SHALL select the installed Node 22 release line or prompt for its installation
- **AND** repository runtime readiness SHALL reject a selected release below 22.23.4, with guidance to install the latest available 22.x release

#### Scenario: Railway deploys with Railpack
- **WHEN** Railway deploys the app using Railpack
- **THEN** Railpack SHALL use a Node 22 release at or above 22.23.4 for both build and runtime
- **AND** the production verification record SHALL identify the actual build and running Node versions

#### Scenario: Nixpacks reads .nvmrc
- **WHEN** a legacy Railway deployment uses Nixpacks and reads .nvmrc
- **THEN** it SHALL select Node 22
- **AND** the deployment SHALL only be accepted after the actual build and runtime versions are verified at or above 22.23.4

#### Scenario: A Node security release is newer than Railpack's release-age cutoff
- **WHEN** a patched Node 22 release is available but is less than 14 days old
- **THEN** app/mise.toml SHALL exempt only Node from Mise's minimum release age
- **AND** fresh builds SHALL be able to select that release without pinning a single Node patch
- **AND** the release-age policy for other tools SHALL remain in effect

### Requirement: Package-level engine constraint

The `/app/package.json` SHALL declare a Node engine constraint accepting only
Node 22 releases at or above 22.23.4 and below 23.0.0. The app lockfile root
package metadata SHALL contain the same engine constraint.

#### Scenario: npm warns on wrong Node version
- **WHEN** a developer runs `npm install` with a Node version below 22.23.4 or outside 22.x
- **THEN** npm SHALL display a warning about the engine mismatch

#### Scenario: Railway reads engines field
- **WHEN** Railway's Railpack detects the `engines.node` field
- **THEN** it SHALL select a Node 22 release at or above 22.23.4 for the deployment environment

#### Scenario: Patched engine metadata is aligned
- **WHEN** the supported runtime floor or selected Node release changes
- **THEN** the app manifest, app lockfile root metadata and version-manager declarations SHALL agree on a patched supported Node 22 runtime

### Requirement: Candidate Verification Runtime

Candidate verification commands SHALL run under a Node 22 runtime at or above
22.23.4 selected according to the repository runtime declarations. Matching
the major version alone SHALL NOT establish runtime readiness.

#### Scenario: Queue command selects Node 22
- **WHEN** queue-managed setup, lint, build, serve, or finalization verification invokes npm for the app
- **THEN** the command SHALL use a compatible patched Node 22 runtime at or above 22.23.4 when one is available

#### Scenario: Child command selects Node 22 despite queue launch runtime
- **WHEN** the queue script itself was launched from an unsupported runtime but a compatible patched Node 22 runtime is available through the local toolchain
- **THEN** queue-managed npm and dev-server child commands SHALL run through that supported patched runtime

#### Scenario: Wrong Node fails before mutation
- **WHEN** the active runtime is below 22.23.4 or outside 22.x and the queue cannot select a compatible patched local runtime
- **THEN** candidate setup SHALL fail before dependency install, build, or serve mutation and report the current version, required minimum and major line, and setup instruction

#### Scenario: Runtime is visible in setup output
- **WHEN** candidate setup prepares or verifies dependencies
- **THEN** the output SHALL include the active Node version and command runner used for npm commands
- **AND** the readiness result SHALL account for the minimum patch release

#### Scenario: Runtime pins remain aligned
- **WHEN** the app runtime pin changes
- **THEN** the root `.nvmrc`, `app/.nvmrc`, `app/package.json`, and app lockfile root metadata SHALL remain aligned before candidate verification is considered ready
