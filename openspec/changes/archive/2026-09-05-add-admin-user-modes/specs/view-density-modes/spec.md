## MODIFIED Requirements

### Requirement: Provide persisted view-density modes
The system SHALL provide `quiet` and `insight` view-density modes to every authenticated account and SHALL provide `test` mode only to administrator accounts when the public Test-view configuration is enabled. Role SHALL be resolved before capability-sensitive view preferences are restored.

#### Scenario: First-time user receives default mode
- **WHEN** an authenticated account loads the main app with no saved view-density preference
- **THEN** a normal-user account SHALL use `quiet` mode
- **AND** an administrator account SHALL use the existing `insight` mode default

#### Scenario: User changes view mode
- **WHEN** an account selects a view mode available to its role
- **THEN** the system SHALL update the visible UI to match that mode
- **AND** the system SHALL save the selected mode to localStorage

#### Scenario: User returns to app
- **WHEN** an account loads the app with a supported saved view-density mode that is available to its role and enabled by configuration
- **THEN** the system SHALL restore that saved mode

#### Scenario: Storage is unavailable or invalid
- **WHEN** localStorage is unavailable or contains an unsupported view-density mode
- **THEN** a normal-user account SHALL fall back to `quiet`
- **AND** an administrator account SHALL fall back to `insight`
- **AND** the system SHALL NOT throw an error or crash

#### Scenario: Stored Test view is disabled by configuration
- **WHEN** localStorage contains `test` and `NEXT_PUBLIC_TEST_VIEW_ENABLED` disables Test view
- **THEN** a normal-user account SHALL fall back to `quiet`
- **AND** an administrator account SHALL fall back to `insight`
- **AND** the system SHALL NOT render Test-only controls

#### Scenario: Stored Test view belongs to a normal user
- **WHEN** a normal-user account loads with `test` in localStorage
- **THEN** the system SHALL fall back to `quiet`
- **AND** the system SHALL NOT render Test-only controls regardless of Test-view configuration

### Requirement: Display discreet three-mode control
The system SHALL display a discreet icon-first segmented view-density control in the top-right area of the main page header containing only modes currently available to the signed-in account's role and enabled by configuration.

#### Scenario: Test view is enabled
- **WHEN** the main page header is rendered for an administrator and Test view is enabled
- **THEN** the control SHALL provide separate icon buttons for `quiet`, `insight`, and `test`
- **AND** the active mode SHALL be visually indicated

#### Scenario: Test view is disabled
- **WHEN** the main page header is rendered for a normal user or Test view is disabled
- **THEN** the control SHALL provide buttons for `quiet` and `insight`
- **AND** it SHALL omit the `test` option

#### Scenario: Control exposes accessible labels
- **WHEN** the user hovers, focuses, or uses assistive technology on a mode option
- **THEN** the system SHALL expose the mode label for that option

### Requirement: Apply insight mode visibility
Insight mode SHALL add human-facing writing, reading, and creative metadata without exposing low-level diagnostics. It SHALL expose model selection only to administrators.

#### Scenario: Insight mode fresh writing view
- **WHEN** an account is composing a new journal entry in `insight` mode
- **THEN** the system SHALL show persona picker, journal word count, auto-analyze readiness text, primary analysis controls, and view-density control
- **AND** the system SHALL show the model picker to an administrator
- **AND** the system SHALL hide the model picker from a normal user

#### Scenario: Insight mode result view
- **WHEN** an account views fresh or historical results in `insight` mode
- **THEN** the system SHALL show analysis reading metadata, image prompt disclosure when a prompt exists, historical analyzed-by context when applicable, and user-facing errors or warnings
- **AND** the system SHALL hide low-level image-generation diagnostics and elapsed-second telemetry

### Requirement: Configure Test-view visibility at build time
The system SHALL use `NEXT_PUBLIC_TEST_VIEW_ENABLED` as a build-time visibility control for Test view and its diagnostic surfaces in addition to the administrator-role requirement. The build-time flag SHALL NOT make Test view available to a normal user.

#### Scenario: Flag is false
- **WHEN** the application is built with `NEXT_PUBLIC_TEST_VIEW_ENABLED=false`
- **THEN** Test view and memory experiment controls SHALL be hidden from the client UI for every role

#### Scenario: Flag is true or unset
- **WHEN** the application is built with `NEXT_PUBLIC_TEST_VIEW_ENABLED=true` or the variable is unset
- **THEN** Test view SHALL retain its existing visible behavior for administrators
- **AND** Test view SHALL remain unavailable to normal users

#### Scenario: Contextual memory operates outside Test view
- **WHEN** Test view is disabled or an account selects Quiet or Insight view
- **THEN** contextual-memory selection and update SHALL continue to operate for administrators according to existing behavior
- **AND** contextual-memory selection, injection, inference, and persistence SHALL remain disabled for normal users
