## ADDED Requirements

### Requirement: First-run welcome empty state

The authenticated app shell SHALL display a lightweight welcome guide when the current user is idle and has no saved analysis history.

#### Scenario: New user sees welcome guide near top

- **WHEN** an authenticated user loads the app
- **AND** the app is idle
- **AND** the user's analysis history has zero entries
- **THEN** the system SHALL display a welcome guide in the main content area below the navigation/header
- **AND** the guide SHALL appear above the journal input so it is visible near the top of the screen

#### Scenario: Welcome guide explains app flow

- **WHEN** the welcome guide is displayed
- **THEN** the guide SHALL briefly explain that the user can write or paste morning pages
- **AND** the guide SHALL briefly explain that the app produces an AI-powered analysis
- **AND** the guide SHALL briefly explain that the app generates four artistic images inspired by the writing

#### Scenario: Returning user does not see welcome guide

- **WHEN** an authenticated user loads the app
- **AND** the user's analysis history has one or more entries
- **THEN** the system SHALL NOT display the welcome guide

#### Scenario: Welcome guide hides outside idle state

- **WHEN** the app is analyzing, showing completed results, showing an error, or viewing history
- **THEN** the system SHALL NOT display the welcome guide

#### Scenario: Welcome guide uses lightweight styling

- **WHEN** the welcome guide is displayed
- **THEN** the guide SHALL use existing design-token colors
- **AND** the guide SHALL NOT visually overwhelm the journal input area
