## Purpose

Ensure consistent Node.js version across local development and cloud deployment environments.

## ADDED Requirements

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
