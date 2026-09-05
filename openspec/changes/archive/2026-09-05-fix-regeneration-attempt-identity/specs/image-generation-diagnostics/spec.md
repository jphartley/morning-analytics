## ADDED Requirements

### Requirement: Distinguish attempt identity from analysis identity
The system SHALL use a fresh diagnostic attempt ID for every initial-generation or regeneration invocation independently of the permanent analysis ID used for persistence.

#### Scenario: Initial generation starts
- **WHEN** initial image generation starts for a new analysis
- **THEN** diagnostics and the selected provider SHALL receive the same fresh attempt ID
- **AND** storage and analysis persistence SHALL continue using the permanent analysis ID

#### Scenario: Regeneration starts
- **WHEN** image regeneration starts for an existing analysis
- **THEN** diagnostics and the selected provider SHALL receive the same fresh attempt ID for that round
- **AND** the diagnostic attempt ID SHALL differ from the permanent analysis ID
- **AND** the permanent analysis ID SHALL continue identifying the database record and storage directory
