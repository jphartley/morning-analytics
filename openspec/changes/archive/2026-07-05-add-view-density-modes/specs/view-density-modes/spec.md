## ADDED Requirements

### Requirement: Provide persisted view-density modes
The system SHALL provide three view-density modes named `quiet`, `insight`, and `test`.

#### Scenario: First-time user receives default mode
- **WHEN** an authenticated user loads the main app with no saved view-density preference
- **THEN** the system SHALL use `insight` mode

#### Scenario: User changes view mode
- **WHEN** the user selects a different view-density mode
- **THEN** the system SHALL update the visible UI to match that mode
- **AND** the system SHALL save the selected mode to localStorage

#### Scenario: User returns to app
- **WHEN** the user loads the app with a supported saved view-density mode in localStorage
- **THEN** the system SHALL restore that saved mode

#### Scenario: Storage is unavailable or invalid
- **WHEN** localStorage is unavailable or contains an unsupported view-density mode
- **THEN** the system SHALL fall back to `insight`
- **AND** the system SHALL NOT throw an error or crash

### Requirement: Display discreet three-mode control
The system SHALL display a discreet icon-first three-segment view-density control in the top-right area of the main page header.

#### Scenario: Control shows all modes
- **WHEN** the main page header is rendered
- **THEN** the control SHALL provide separate icon buttons for `quiet`, `insight`, and `test`
- **AND** the active mode SHALL be visually indicated

#### Scenario: Control exposes accessible labels
- **WHEN** the user hovers, focuses, or uses assistive technology on a mode option
- **THEN** the system SHALL expose the mode label for that option

### Requirement: Apply quiet mode visibility
Quiet mode SHALL prioritize writing and core output while hiding observability metadata and diagnostic details.

#### Scenario: Quiet mode fresh writing view
- **WHEN** the user is composing a new journal entry in `quiet` mode
- **THEN** the system SHALL show the journal writing pane, primary analysis controls, persona picker, and view-density control
- **AND** the system SHALL hide model picker, word count, auto-analyze readiness text, mock-mode banner, and diagnostic controls

#### Scenario: Quiet mode result view
- **WHEN** the user views fresh or historical results in `quiet` mode
- **THEN** the system SHALL show the analysis, images, original historical input when applicable, image regeneration control when applicable, and user-facing errors or warnings
- **AND** the system SHALL hide analysis reading metadata, historical analyzed-by banner, image prompt disclosure, elapsed seconds, and image-generation diagnostics

#### Scenario: Quiet mode image generation pending
- **WHEN** image generation is pending in `quiet` mode
- **THEN** the system SHALL show gentle image progress
- **AND** the system SHALL hide timing, elapsed seconds, provider details, and diagnostic controls

### Requirement: Apply insight mode visibility
Insight mode SHALL add human-facing writing, reading, and creative metadata without exposing low-level diagnostics.

#### Scenario: Insight mode fresh writing view
- **WHEN** the user is composing a new journal entry in `insight` mode
- **THEN** the system SHALL show persona picker, model picker, journal word count, auto-analyze readiness text, primary analysis controls, and view-density control

#### Scenario: Insight mode result view
- **WHEN** the user views fresh or historical results in `insight` mode
- **THEN** the system SHALL show analysis reading metadata, image prompt disclosure when a prompt exists, historical analyzed-by context when applicable, and user-facing errors or warnings
- **AND** the system SHALL hide low-level image-generation diagnostics and elapsed-second telemetry

### Requirement: Apply test mode visibility
Test mode SHALL include all insight mode surfaces plus system observability and diagnostic details.

#### Scenario: Test mode shows diagnostics
- **WHEN** the user views pending or completed image generation in `test` mode
- **THEN** the system SHALL show elapsed seconds when available, image-generation diagnostics disclosure, provider details, attempt metadata, event timeline details, and diagnostic copy controls

#### Scenario: Test mode shows mock indicator
- **WHEN** mock image provider mode is active and the user is in `test` mode
- **THEN** the system SHALL show the mock-mode banner

### Requirement: Keep errors and warnings visible
The system SHALL keep actionable errors and warnings visible in all view-density modes.

#### Scenario: Error occurs in quiet mode
- **WHEN** a save, history, analysis, image generation, upload, authentication, or image-cap error occurs in `quiet` mode
- **THEN** the system SHALL show a user-facing error or warning message
- **AND** the system SHALL NOT require switching modes to discover that the action failed

#### Scenario: Diagnostic detail is mode-limited
- **WHEN** an error or warning has diagnostic detail
- **THEN** the system SHALL show the user-facing summary in all modes
- **AND** the system SHALL show diagnostic detail only in `test` mode
