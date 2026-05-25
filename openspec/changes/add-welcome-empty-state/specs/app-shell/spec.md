## ADDED Requirements

### Requirement: Show first-use empty state guidance

The system SHALL display lightweight welcome guidance in the idle app shell when the current user has no saved analysis history. The guidance SHALL briefly explain the app flow and SHALL be hidden once the user has at least one saved analysis history entry.

#### Scenario: New user sees welcome guidance

- **WHEN** the app is idle
- **AND** history has loaded successfully with zero saved analyses
- **THEN** the system displays welcome guidance near the journal input
- **THEN** the guidance explains that the user can paste or type morning pages, get an AI-powered psychoanalytic analysis, and receive 4 artistic images inspired by the writing

#### Scenario: Existing user does not see welcome guidance

- **WHEN** the app is idle
- **AND** history has loaded successfully with one or more saved analyses
- **THEN** the system does not display the welcome guidance

#### Scenario: Guidance disappears after first saved analysis

- **WHEN** a user with zero saved analyses completes and saves their first analysis
- **AND** history refreshes with one saved analysis
- **THEN** the system hides the welcome guidance

#### Scenario: Guidance remains lightweight

- **WHEN** the welcome guidance is displayed
- **THEN** the journal input and Analyze button remain the primary visual focus
- **THEN** the guidance uses existing design token Tailwind classes for background, text, border, and accent styling
