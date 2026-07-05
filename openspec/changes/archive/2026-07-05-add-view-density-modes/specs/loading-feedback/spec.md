## MODIFIED Requirements

### Requirement: Display expected duration hint

The LoadingState component SHALL display a duration hint below the rotating message in smaller, muted text in insight and test modes. Quiet mode SHALL hide duration hints while preserving gentle loading progress.

#### Scenario: Duration hint for text analysis

- **WHEN** the app is in the "analyzing" state in `insight` or `test` mode
- **THEN** the spinner SHALL display a duration hint indicating approximately 15 seconds

#### Scenario: Duration hint for image generation

- **WHEN** the app is in the "text-ready" state (images generating) in `insight` or `test` mode
- **THEN** the spinner SHALL display a duration hint indicating approximately 1 minute

#### Scenario: Quiet mode hides duration hint
- **WHEN** the app is in a loading state in `quiet` mode
- **THEN** the system SHALL show gentle progress
- **AND** the system SHALL NOT show expected duration hints
