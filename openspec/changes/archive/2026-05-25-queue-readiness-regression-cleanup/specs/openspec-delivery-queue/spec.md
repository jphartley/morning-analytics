## ADDED Requirements

### Requirement: Candidate Setup Regression Gate

The system SHALL block candidate verification paths that bypass queue-managed setup.

#### Scenario: Raw verification is redirected
- **WHEN** a queue workflow is about to run candidate lint, build, serve, or finalization verification directly
- **THEN** the workflow SHALL route through `setup <change>`, `prepare-test <change>`, or another queue-owned setup path first

#### Scenario: Verification requires current setup
- **WHEN** queue-managed verification starts
- **THEN** the system SHALL verify setup completed successfully for the current candidate worktree and relevant setup inputs

#### Scenario: Setup failure blocks verification
- **WHEN** dependency install, Node runtime selection, or build env preparation fails
- **THEN** the system SHALL block verification and report the failed setup precondition instead of surfacing a later lint or build command-not-found failure

### Requirement: Main Spec Structure Finalization Preflight

The system SHALL validate touched main OpenSpec specs for archive-compatible structure before finalization can merge and push.

#### Scenario: Structurally invalid main spec blocks finalization
- **WHEN** finalization prepares to archive a candidate and a touched main spec is missing required OpenSpec structure
- **THEN** the system SHALL block merge and push, report the invalid spec path, and preserve the candidate for repair or recovery

#### Scenario: Archive blocker remains active
- **WHEN** archive fails because a main spec is structurally invalid
- **THEN** the completed candidate SHALL remain active or explicitly partial until the spec is repaired and archive succeeds

#### Scenario: Successful repair permits archive
- **WHEN** the blocking main spec structure is repaired without changing intended behavior
- **THEN** the queue SHALL allow archive to proceed and remove the completed active change through the normal archive path
