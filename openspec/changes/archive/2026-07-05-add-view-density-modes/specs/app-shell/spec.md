## ADDED Requirements

### Requirement: Honor view-density modes in the app shell
The main app shell SHALL render controls, metadata, and diagnostics according to the selected view-density mode while preserving the core analysis workflow.

#### Scenario: Header controls follow mode
- **WHEN** the main page header is displayed
- **THEN** the system SHALL show the view-density control in all modes
- **AND** the system SHALL show the analyst persona picker in all modes
- **AND** the system SHALL show the model picker only in `insight` and `test` modes

#### Scenario: Mock mode banner follows mode
- **WHEN** mock image provider mode is active
- **THEN** the system SHALL show the mock-mode banner only in `test` mode

#### Scenario: History context follows mode
- **WHEN** the user views a historical analysis
- **THEN** the system SHALL show the original input in all modes
- **AND** the system SHALL show the analyzed-by banner only in `insight` and `test` modes

#### Scenario: User-facing warnings remain visible
- **WHEN** a warning or error is present in any mode
- **THEN** the app shell SHALL render a user-facing warning or error message

## MODIFIED Requirements

### Requirement: Display collapsible image generation diagnostics

The app shell SHALL provide a collapsible diagnostics disclosure for the current image generation attempt near the generated-images area only in test mode.

#### Scenario: Image generation is waiting
- **WHEN** text analysis has completed, image generation is in progress, and the user is in `test` mode
- **THEN** the app SHALL preserve the existing image loading presentation
- **THEN** the app SHALL NOT add an extra diagnostic or phase-status sentence to the loading state
- **THEN** the app SHALL show a small, low-emphasis icon-only diagnostics disclosure near the image loading area
- **THEN** expanding the diagnostics disclosure SHALL indicate that the request is still running and detailed server events will appear after the request returns

#### Scenario: Diagnostics are available
- **WHEN** image generation returns diagnostics and the user is in `test` mode
- **THEN** the app SHALL make the diagnostic trace available behind a collapsed disclosure by default
- **THEN** the collapsed disclosure SHALL be an icon-only status affordance that is visually minimal and secondary to the generated images
- **THEN** the user SHALL be able to expand the disclosure to inspect redacted stage details
- **THEN** the expanded disclosure SHALL explain diagnostic events in plain language before showing raw event details
- **THEN** the expanded disclosure SHALL provide a copy action for a paste-ready diagnostic report

#### Scenario: Image generation fails after text analysis
- **WHEN** text analysis succeeds but image generation fails
- **THEN** the app SHALL keep the analysis visible
- **THEN** the app SHALL display a specific image-generation failure summary in all view-density modes
- **THEN** the app SHALL provide a visually subtle redacted diagnostics disclosure for local debugging only in `test` mode
