## MODIFIED Requirements

### Requirement: Provide persisted view-density modes
The system SHALL provide `quiet` and `insight` view-density modes and SHALL provide `test` mode only when the public Test-view configuration is enabled.

#### Scenario: First-time user receives default mode
- **WHEN** an authenticated user loads the main app with no saved view-density preference
- **THEN** the system SHALL use `insight` mode

#### Scenario: User changes view mode
- **WHEN** the user selects a different available view-density mode
- **THEN** the system SHALL update the visible UI to match that mode
- **AND** the system SHALL save the selected mode to localStorage

#### Scenario: User returns to app
- **WHEN** the user loads the app with a supported and currently available saved view-density mode in localStorage
- **THEN** the system SHALL restore that saved mode

#### Scenario: Storage is unavailable or invalid
- **WHEN** localStorage is unavailable or contains an unsupported view-density mode
- **THEN** the system SHALL fall back to `insight`
- **AND** the system SHALL NOT throw an error or crash

#### Scenario: Stored Test view is disabled by configuration
- **WHEN** localStorage contains `test` and `NEXT_PUBLIC_TEST_VIEW_ENABLED` disables Test view
- **THEN** the system SHALL fall back to `insight`
- **AND** it SHALL NOT render Test-only controls

### Requirement: Display discreet three-mode control
The system SHALL display a discreet icon-first segmented view-density control in the top-right area of the main page header containing only modes currently enabled by configuration.

#### Scenario: Test view is enabled
- **WHEN** the main page header is rendered and Test view is enabled
- **THEN** the control SHALL provide separate icon buttons for `quiet`, `insight`, and `test`
- **AND** the active mode SHALL be visually indicated

#### Scenario: Test view is disabled
- **WHEN** the main page header is rendered and Test view is disabled
- **THEN** the control SHALL provide buttons for `quiet` and `insight`
- **AND** it SHALL omit the `test` option

#### Scenario: Control exposes accessible labels
- **WHEN** the user hovers, focuses, or uses assistive technology on an available mode option
- **THEN** the system SHALL expose the mode label for that option

## ADDED Requirements

### Requirement: Configure Test-view visibility at build time
The system SHALL use `NEXT_PUBLIC_TEST_VIEW_ENABLED` as a build-time visibility control for Test view and its diagnostic surfaces.

#### Scenario: Flag is false
- **WHEN** the application is built with `NEXT_PUBLIC_TEST_VIEW_ENABLED=false`
- **THEN** Test view and memory experiment controls SHALL be hidden from the client UI

#### Scenario: Flag is true or unset
- **WHEN** the application is built with `NEXT_PUBLIC_TEST_VIEW_ENABLED=true` or the variable is unset
- **THEN** Test view SHALL retain its existing visible behavior

#### Scenario: Contextual memory operates outside Test view
- **WHEN** Test view is disabled or the user selects Quiet or Insight view
- **THEN** contextual-memory selection and update SHALL continue to operate
