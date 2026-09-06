## Purpose

Give project operators a reusable but deliberately explicit way to remove
disposable test accounts and all application data associated with them.

## ADDED Requirements

### Requirement: Operators explicitly select cleanup targets
The generic cleanup command SHALL accept one or more repeated email arguments
as its only account-selection mechanism. It MUST reject missing, malformed, or
unrecognized arguments and MUST deduplicate repeated target email addresses.

#### Scenario: Operator supplies multiple target accounts
- **WHEN** an operator supplies two or more valid repeated email arguments
- **THEN** the command SHALL preview each unique supplied target account

#### Scenario: Operator supplies no target account
- **WHEN** an operator omits email arguments
- **THEN** the command SHALL fail without connecting to or mutating Supabase

### Requirement: Cleanup has independent preview and execution safeguards
The generic cleanup command SHALL perform no mutation by default. It MUST
require both an apply argument and a separate destructive-confirmation argument
before deleting data, and MUST resolve every requested account before starting
any mutation.

#### Scenario: Operator previews a target
- **WHEN** an operator supplies target emails without both destructive arguments
- **THEN** the command SHALL report planned related-data cleanup without deleting data

#### Scenario: A requested account is missing
- **WHEN** one or more explicit target accounts cannot be resolved
- **THEN** the command SHALL fail before deleting any requested account or data

### Requirement: Generic cleanup removes related data safely
For every resolved target account, the command SHALL list metadata-only counts,
remove its analysis-owned storage objects, remove its analysis rows, verify no
analysis rows remain, and then delete its Auth user. It SHALL allow configured
database cascades to remove the profile and contextual-memory records.

#### Scenario: Cleanup succeeds for an account with generated images
- **WHEN** a target account has analyses that reference generated images
- **THEN** the command SHALL remove only images within those analyses' storage folders before removing analyses and the Auth user

#### Scenario: An account cleanup fails
- **WHEN** cleanup fails while removing a target account's images or analyses
- **THEN** the command SHALL not delete that account's Auth user, SHALL report the account-level failure without journal text or credentials, and SHALL return a non-zero exit status

### Requirement: Operators receive an auditable outcome
The command SHALL emit a per-account preview and final outcome using email
addresses and record counts only. It MUST not emit journal text, credentials,
or authentication tokens.

#### Scenario: Partial cleanup outcome
- **WHEN** one target succeeds and a later target fails
- **THEN** the command SHALL report both outcomes and return a non-zero exit status
