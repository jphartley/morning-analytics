## ADDED Requirements

### Requirement: Select an analysis memory mode before submission
The system SHALL let a Test-view user select exactly one analysis memory mode before submitting a new journal entry: No memory, Use memory, or Blind comparison.

#### Scenario: Test view opens for a new entry
- **WHEN** the user opens a new journal entry in enabled Test view
- **THEN** the system SHALL show the three analysis memory modes before the journal editor
- **AND** Use memory SHALL be selected by default
- **AND** each option SHALL state whether it produces one analysis or two analyses

#### Scenario: User selects No memory
- **WHEN** the user submits a new entry with No memory selected
- **THEN** the system SHALL produce one analysis without selecting or injecting contextual memory

#### Scenario: User selects Use memory
- **WHEN** the user submits a new entry with Use memory selected
- **THEN** the system SHALL produce one analysis through the contextual-memory selection path

#### Scenario: User selects Blind comparison
- **WHEN** the user submits a new entry with Blind comparison selected
- **THEN** the system SHALL produce the two-result blind comparison

#### Scenario: User is outside Test view
- **WHEN** Quiet or Insight view is selected
- **THEN** the system SHALL hide the analysis memory mode selector
- **AND** submission SHALL use the memory-enabled single-analysis path

#### Scenario: Saved no-memory result contributes to future memory
- **WHEN** a No memory result is selected and saved successfully
- **THEN** the system SHALL update durable memory once from the original journal entry
- **AND** the update SHALL NOT affect the already generated no-memory analysis

## MODIFIED Requirements

### Requirement: Compare new analyses blindly
The system SHALL let a Test-view user choose Blind comparison before submitting a new journal entry and SHALL generate an ephemeral comparison using the selected model and persona.

#### Scenario: Blind comparison mode is submitted
- **WHEN** the user submits a new entry with Blind comparison selected
- **THEN** the system SHALL select relevant memory once
- **AND** it SHALL generate one text analysis with that memory and one without it
- **AND** it SHALL assign the results randomly to unlabeled A and B positions

#### Scenario: Blind results are displayed for reading
- **WHEN** Analysis A and Analysis B are displayed before or after condition reveal
- **THEN** the system SHALL place Analysis A above Analysis B
- **AND** each analysis SHALL use the full comparison content width

#### Scenario: User records an informal preference
- **WHEN** the user selects A, B, or no meaningful difference
- **THEN** the system SHALL reveal which result used memory
- **AND** it SHALL show the memories supplied to the memory-enabled result
- **AND** it SHALL NOT persist the selection or comparison outcome

#### Scenario: Preferred result continues
- **WHEN** the user chooses A or B as preferred
- **THEN** only that analysis and its image prompt SHALL continue to image generation and saving
- **AND** the system SHALL update memory exactly once from the original journal entry after saving

#### Scenario: No meaningful difference is selected
- **WHEN** the user selects no meaningful difference
- **THEN** the system SHALL reveal the conditions
- **AND** it SHALL require an explicit result choice before saving or allow the user to leave without saving

#### Scenario: Historical analysis is displayed
- **WHEN** the user views an existing saved analysis
- **THEN** the system SHALL NOT offer analysis memory mode selection or a blind-comparison action for that historical entry
