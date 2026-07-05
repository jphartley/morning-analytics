## ADDED Requirements

### Requirement: Preserve regeneration access across view modes
The system SHALL keep image regeneration controls available across quiet, insight, and test modes whenever regeneration is possible.

#### Scenario: Regeneration is available in quiet mode
- **WHEN** an analysis has an image prompt and regeneration is possible in `quiet` mode
- **THEN** the system SHALL show the "Regenerate Images" button

#### Scenario: Cap warning remains visible
- **WHEN** an analysis reaches the maximum image count in any view-density mode
- **THEN** the system SHALL disable the regeneration control
- **AND** the system SHALL show the maximum-image warning message

#### Scenario: Regeneration diagnostics are mode-limited
- **WHEN** regeneration returns diagnostic context outside `test` mode
- **THEN** the system SHALL hide diagnostic detail
- **AND** the system SHALL keep any user-facing error or warning visible
