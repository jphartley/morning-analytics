## MODIFIED Requirements

### Requirement: Persist persona selection

The system SHALL save the user's selected analyst persona to browser localStorage and use that value as the visible and submitted persona for the current session.

#### Scenario: User changes persona selection
- **WHEN** user selects a different persona from the picker
- **THEN** system updates the selected persona in page state
- **AND** system saves the persona ID to localStorage
- **AND** the picker displays the same persona that page state will submit

#### Scenario: User returns to app
- **WHEN** user loads the app with a previously saved, currently supported persona
- **THEN** system displays the saved persona as selected

#### Scenario: User analyzes with selected persona
- **WHEN** user submits journal text for analysis
- **THEN** system passes the currently selected persona to the `analyzeText` server action

## ADDED Requirements

### Requirement: Gracefully fall back from unavailable persona storage

The system SHALL use `jungian` without error when browser localStorage is unavailable, has no saved persona, or contains a persona ID that is not currently supported.

#### Scenario: localStorage is unavailable
- **WHEN** browser localStorage cannot be read or written
- **THEN** system uses `jungian` as the analyst persona
- **AND** persona changes continue working for the current session
- **AND** system does not throw an error or crash

#### Scenario: Saved persona is no longer supported
- **WHEN** localStorage contains a persona ID that is not one of the current picker options
- **THEN** system uses `jungian` as the analyst persona
- **AND** system does not throw an error or crash
