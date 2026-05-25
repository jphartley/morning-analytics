## ADDED Requirements

### Requirement: Verification Scope Policy

The system SHALL distinguish candidate-caused verification failures from unrelated baseline failures before queued candidate scope is expanded.

#### Scenario: Candidate-caused failure is fixed in candidate
- **WHEN** lint, build, or readiness verification fails because of files or behavior changed by the candidate
- **THEN** the Builder SHALL fix the failure inside the candidate worktree before Gate 2 handoff or finalization

#### Scenario: Unrelated baseline failure stops candidate expansion
- **WHEN** lint, build, or readiness verification fails because of an issue that predates or is unrelated to the candidate
- **THEN** the queue workflow SHALL stop candidate expansion and report the baseline failure separately from the candidate work

#### Scenario: Explicit approval can expand scope
- **WHEN** the user explicitly approves including unrelated baseline cleanup in the current candidate
- **THEN** the workflow MAY include that cleanup and SHALL record that scope expansion in the candidate summary or task notes

#### Scenario: Dedicated hygiene change remains preferred
- **WHEN** unrelated baseline failures are substantial, risky, or outside the approved feature behavior
- **THEN** the workflow SHALL recommend a dedicated hygiene change before resuming feature candidate finalization
