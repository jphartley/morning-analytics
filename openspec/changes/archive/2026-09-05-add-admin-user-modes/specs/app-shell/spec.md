## MODIFIED Requirements

### Requirement: Honor view-density modes in the app shell
The main app shell SHALL render controls, metadata, diagnostics, and defaults according to the signed-in account's role and selected available view. Every role SHALL retain the core workflow for journal entry, analysis, generated images, personal history, regeneration, deletion of the account's own analyses, analyst selection, palette selection, and user-facing warnings and errors.

#### Scenario: Header controls follow mode
- **WHEN** the main page header is displayed for a user-role account
- **THEN** the system SHALL show the analyst persona picker and the Quiet/Insights view control
- **AND** it SHALL not show Test/Debug, the model picker, or the provider picker
- **WHEN** the main page header is displayed for an administrator
- **THEN** the system SHALL show the analyst persona picker and the available Quiet/Insights/Test view control
- **AND** it SHALL show the model picker only in Insights and Test/Debug
- **AND** it SHALL show the provider picker only in enabled Test/Debug

#### Scenario: Mock mode banner follows mode
- **WHEN** mock image-provider mode is active
- **THEN** the system SHALL show the mock-mode banner only to an administrator in enabled Test/Debug
- **AND** it SHALL not show the banner to a normal user or in administrator Quiet or Insights

#### Scenario: History context follows mode
- **WHEN** a user views one of their historical analyses
- **THEN** the system SHALL show the original input in every available view
- **AND** it SHALL show the human-facing analyzed-by banner in Insights and administrator Test/Debug
- **AND** it SHALL hide the analyzed-by banner in Quiet
- **AND** it SHALL preserve access to the analysis, images, regeneration, and deletion controls permitted for that user's own record

#### Scenario: User-facing warnings remain visible
- **WHEN** a warning or error is present for either role in any available view
- **THEN** the app shell SHALL render a user-facing warning or error message
- **AND** detailed diagnostic internals SHALL remain limited to administrator Test/Debug

#### Scenario: Normal-user header controls render
- **WHEN** a user-role account views the main page header
- **THEN** the system SHALL show analyst selection, Quiet/Insights selection, and no model or provider picker

#### Scenario: Administrator header controls render
- **WHEN** an administrator views Insights or Test/Debug
- **THEN** the system SHALL show analyst selection, view selection, and model selection
- **AND** it SHALL show provider selection only in enabled Test/Debug

#### Scenario: Administrator views Quiet
- **WHEN** an administrator selects Quiet
- **THEN** the system SHALL keep the analyst and view controls available
- **AND** it SHALL hide the model and provider pickers while preserving their previously selected administrator values according to their respective specifications

#### Scenario: Normal-user historical analysis renders
- **WHEN** a user-role account views a saved analysis
- **THEN** the system SHALL preserve its core analysis, images, original entry, regeneration, and delete controls
- **AND** it SHALL limit metadata visibility to the selected Quiet or Insights behavior

#### Scenario: Palette selection remains available
- **WHEN** either a normal user or administrator views an authentication or application page
- **THEN** the existing palette picker SHALL remain available
- **AND** its browser-local persistence behavior SHALL remain unchanged
