# app-repo-queue-readiness Specification

## Purpose

Define repository and app readiness expectations that keep queued worktrees predictable, verifiable, and safe for local auth/backend testing.

## Requirements

### Requirement: App Baseline Verification Contract

The repository SHALL document the app baseline verification checks that `main` is expected to pass before queued feature work starts.

#### Scenario: Main passes lint
- **WHEN** a developer or queue operator validates the app baseline from `app/` on `main`
- **THEN** `npm run lint` SHALL pass or the failure SHALL be documented as baseline debt outside a feature candidate

#### Scenario: Main passes build with documented env expectations
- **WHEN** a developer or queue operator runs `npm run build` from `app/` on `main`
- **THEN** the build SHALL pass when the documented build-time env requirements are satisfied

#### Scenario: Lockfile registry safety is checked
- **WHEN** a change modifies `app/package-lock.json`
- **THEN** `npm run check:lockfile-registry` SHALL pass before the change is considered ready

#### Scenario: Baseline debt is tracked separately
- **WHEN** known lint, build, env, or lockfile issues predate a feature candidate
- **THEN** those issues SHALL be documented or tracked separately from the candidate implementation

### Requirement: Clean Worktree Dependency Setup

The repository SHALL document a predictable dependency setup path for clean app worktrees.

#### Scenario: Clean worktree installs dependencies
- **WHEN** a fresh candidate worktree does not have `app/node_modules`
- **THEN** setup instructions SHALL direct the operator to run `npm ci` from `app/`

#### Scenario: Node version is aligned
- **WHEN** clean worktree setup instructions mention the runtime
- **THEN** they SHALL refer to the Node version declared by `app/.nvmrc`, `app/package.json`, and `app/package-lock.json`

#### Scenario: Lockfile registry check is preserved
- **WHEN** clean worktree setup or dependency documentation discusses lockfile changes
- **THEN** it SHALL include `npm run check:lockfile-registry` and the registry-safe workflow

#### Scenario: Node modules symlink shortcut is discouraged
- **WHEN** documentation describes dependency setup for Turbopack or Next.js candidates
- **THEN** it SHALL not recommend sharing `node_modules` by symlink unless that shortcut has been separately validated as safe

### Requirement: Local Env Documentation

The app SHALL provide non-secret local environment documentation that identifies which env vars are required for build, local development, auth/manual testing, and mock operation.

#### Scenario: Env example contains required keys
- **WHEN** a developer opens `app/.env.example`
- **THEN** it SHALL list the required public and server env keys without containing real secret values

#### Scenario: Supabase auth env is identified
- **WHEN** local docs describe Supabase-backed signin, signup, history, or storage flows
- **THEN** they SHALL identify the Supabase URL, anon key, and service role key expectations needed by those flows

#### Scenario: Placeholder env is distinguished from real env
- **WHEN** local docs describe placeholder or mock env values
- **THEN** they SHALL state which verification paths placeholders can support and which backend or auth paths require real local config

#### Scenario: Missing env behavior is documented
- **WHEN** local docs describe running build, dev, or auth flows without required env values
- **THEN** they SHALL explain the expected failure or mock behavior without exposing secret values

### Requirement: Auth Manual-Test Readiness

The repository SHALL define when a local app instance is ready for Supabase-backed auth manual testing.

#### Scenario: Real env is present for auth testing
- **WHEN** a candidate is handed off for signin or signup manual testing
- **THEN** the candidate SHALL have real local Supabase URL and anon key values available through the documented local env path

#### Scenario: Placeholder env blocks auth handoff
- **WHEN** a candidate uses placeholder Supabase URL, anon key, or backend credentials
- **THEN** docs and queue-facing guidance SHALL not present signin, signup, history, or storage manual testing as ready

#### Scenario: Secret values are not printed
- **WHEN** readiness guidance asks an operator to confirm local env presence
- **THEN** it SHALL require presence or placeholder checks without printing secret values

### Requirement: Markdown Renderer Lint Pattern

The app SHALL use a lint-clean pattern for React markdown renderers that receive internal renderer props not meant for DOM elements.

#### Scenario: Internal node prop is omitted
- **WHEN** a markdown renderer spreads props onto a DOM element
- **THEN** it SHALL omit the internal `node` prop before spreading DOM props

#### Scenario: Underscore unused arguments are not relied on
- **WHEN** markdown renderer code avoids unused parameter lint failures
- **THEN** it SHALL not rely on underscore-prefixed unused arguments unless the ESLint configuration explicitly allows them

#### Scenario: Pattern is reusable or documented
- **WHEN** markdown renderer components use the omission pattern
- **THEN** the helper or nearby code SHALL make the reason clear enough for future renderers to reuse it

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
