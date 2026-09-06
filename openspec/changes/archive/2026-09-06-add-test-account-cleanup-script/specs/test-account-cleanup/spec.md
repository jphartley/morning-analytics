## Purpose

Provide a safe and auditable way for project operators to remove the known
disposable accounts created while testing the first-use experience.

## ADDED Requirements

### Requirement: Cleanup scope is fixed and visible
The cleanup command SHALL target only the four designated test-account email
addresses. It MUST list the accounts and the counts of their related analyses,
images, memories, and evidence before making a destructive change, and MUST
not print journal text, credentials, or authentication tokens.

#### Scenario: Operator runs the default command
- **WHEN** an operator runs the cleanup command without its destructive confirmation
- **THEN** the command SHALL perform no mutation and report the planned cleanup for only the designated accounts

#### Scenario: A designated account cannot be resolved
- **WHEN** one or more designated email addresses are absent from Supabase Auth
- **THEN** the command SHALL fail before deleting any account or related data

### Requirement: Destructive cleanup requires deliberate confirmation
The cleanup command SHALL require a dedicated explicit confirmation argument
before deleting data. It MUST reject unrecognized arguments and MUST never
accept arbitrary target email addresses as command-line input.

#### Scenario: Operator omits destructive confirmation
- **WHEN** an operator runs the command without the dedicated confirmation argument
- **THEN** the command SHALL exit successfully after its dry-run report without deleting data

#### Scenario: Operator supplies destructive confirmation
- **WHEN** an operator runs the command with the dedicated confirmation argument
- **THEN** the command SHALL execute cleanup only after it has resolved the complete fixed target set

### Requirement: Related account data is removed before authentication
For every target account, the cleanup command SHALL remove all storage objects
referenced by that account's saved analyses, including paths stored in legacy
and per-generation metadata, before deleting the corresponding analysis rows
and Auth user. It SHALL rely on configured database cascades for profiles and
contextual-memory records.

#### Scenario: Cleanup succeeds for an account with generated images
- **WHEN** a target account has analyses that reference images
- **THEN** the command SHALL delete the referenced storage objects, delete the account's analysis rows, and then delete that account's Auth user

#### Scenario: Related data removal fails
- **WHEN** a storage-object or analysis-row deletion fails for a target account
- **THEN** the command SHALL not delete that account's Auth user and SHALL report the failure without exposing journal content

### Requirement: Cleanup outcome is verifiable
The cleanup command SHALL report a per-account outcome and return a non-zero
exit status if any target cannot be fully cleaned. Successful account outcomes
MUST confirm that no analysis rows remain for the deleted account.

#### Scenario: A later account cleanup fails
- **WHEN** cleanup completes for one target but fails for a later target
- **THEN** the command SHALL preserve the completed outcome, report the incomplete account, and return a non-zero exit status
