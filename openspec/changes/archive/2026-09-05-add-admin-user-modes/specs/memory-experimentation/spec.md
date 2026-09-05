## MODIFIED Requirements

### Requirement: Select an analysis memory mode before submission
The system SHALL let an administrator in enabled Test/Debug select exactly one analysis memory mode before submitting a new journal entry: No memory, Use memory, or Blind comparison. Administrator submissions in Quiet or Insights SHALL retain the memory-enabled single-analysis path. Normal-user submissions in Quiet or Insights SHALL always use a memory-free single-analysis path and SHALL not display a memory-mode selector.

#### Scenario: Test view opens for a new entry
- **WHEN** an administrator opens a new journal entry in enabled Test/Debug
- **THEN** the system SHALL show the three analysis memory modes before the journal editor
- **AND** Use memory SHALL be selected by default
- **AND** each option SHALL state whether it produces one analysis or two analyses

#### Scenario: User selects No memory
- **WHEN** an administrator submits a new entry with No memory selected
- **THEN** the system SHALL produce one analysis without selecting or injecting contextual memory

#### Scenario: User selects Use memory
- **WHEN** an administrator submits a new entry with Use memory selected
- **THEN** the system SHALL produce one analysis through the contextual-memory selection path

#### Scenario: User selects Blind comparison
- **WHEN** an administrator submits a new entry with Blind comparison selected
- **THEN** the system SHALL produce the two-result blind comparison

#### Scenario: User is outside Test view
- **WHEN** an administrator selects Quiet or Insights
- **THEN** the system SHALL hide the analysis memory mode selector
- **AND** submission SHALL use the memory-enabled single-analysis path

#### Scenario: Normal user submits outside Test view
- **WHEN** a user-role account submits an entry in Quiet or Insights
- **THEN** the system SHALL hide the analysis memory mode selector
- **AND** submission SHALL produce one analysis without retrieving, selecting, or injecting contextual memory

#### Scenario: Saved no-memory result contributes to future memory
- **WHEN** an administrator selects and successfully saves a No memory result
- **THEN** the system SHALL update durable memory once from the original journal entry
- **AND** the update SHALL NOT affect the already generated no-memory analysis

## ADDED Requirements

### Requirement: Restrict contextual-memory experimentation to administrators
The system SHALL make the Test-view memory drawer, memory-mode selector, blind comparison, reset, and rebuild controls available only to administrator accounts. Applying, resolving, or changing an account to the `user` role SHALL NOT delete or modify any existing memory or evidence owned by that account; those records SHALL remain dormant unless the account later regains an administrator memory-enabled flow. Memory deletion SHALL occur only through the existing administrator reset operation after explicit confirmation.

#### Scenario: Normal user opens the application
- **WHEN** a user-role account loads Quiet or Insights
- **THEN** the application SHALL not render any contextual-memory experiment or diagnostic control

#### Scenario: Administrator opens Test/Debug
- **WHEN** an administrator selects enabled Test/Debug
- **THEN** the existing memory experiment controls SHALL remain available for that administrator's own memory records

#### Scenario: Existing account with memory resolves as a normal user
- **WHEN** an existing account owns contextual-memory records and resolves to the `user` role
- **THEN** the system SHALL not delete, reset, rebuild, or otherwise modify those records as part of role resolution or migration
- **AND** the records SHALL remain unavailable to the normal-user analysis flow

#### Scenario: Normal user cannot initiate destructive memory operations
- **WHEN** a user-role account uses Quiet or Insights
- **THEN** the system SHALL not expose reset or rebuild controls
- **AND** hiding memory functionality SHALL not itself mutate stored memory or evidence

#### Scenario: Administrator explicitly confirms reset
- **WHEN** an administrator invokes reset in enabled Test/Debug and completes the existing confirmation flow
- **THEN** the system MAY delete that administrator's memory and evidence according to the reset specification
- **AND** it SHALL not delete journal entries or saved analyses
