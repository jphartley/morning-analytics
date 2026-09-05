# memory-experimentation Specification

## Purpose

Define Test-view diagnostics, reset and rebuild controls, and ephemeral blind comparison behavior for the contextual-memory experiment.

## Requirements

### Requirement: Provide a read-only Test-view memory drawer
The system SHALL provide a lightweight memory diagnostic drawer only while Test view is selected and enabled.

#### Scenario: User opens the drawer
- **WHEN** the user opens memory diagnostics in Test view
- **THEN** the drawer SHALL list the complete current user-scoped memory store
- **AND** it SHALL show each memory's compact summary, confidence, temporal state, dates, and supporting evidence

#### Scenario: User views a saved analysis
- **WHEN** a displayed analysis has a stored memory-context snapshot
- **THEN** the drawer SHALL highlight the memory records or snapshots that informed that analysis

#### Scenario: User is outside Test view
- **WHEN** Quiet or Insight view is selected
- **THEN** the memory diagnostic drawer and experiment controls SHALL be hidden

#### Scenario: Drawer is read-only
- **WHEN** a memory record is displayed
- **THEN** the drawer SHALL NOT provide individual correction or deletion controls

### Requirement: Rebuild memory from the newest entries
The system SHALL let a Test-view user rebuild their memory from the newest configurable number of saved journal entries, defaulting to seven.

#### Scenario: Default rebuild
- **WHEN** the user starts a rebuild without changing the numeric input
- **THEN** the system SHALL select the newest seven journal entries owned by that user

#### Scenario: User requests fourteen entries
- **WHEN** the user enters 14 and starts a rebuild
- **THEN** the system SHALL select the newest 14 journal entries owned by that user
- **AND** it SHALL NOT select the oldest 14 entries

#### Scenario: Selected window is replayed
- **WHEN** the newest N entries have been selected in reverse chronological order
- **THEN** the system SHALL clear the current memory store
- **AND** it SHALL replay the selected entries oldest-to-newest so the newest evidence is applied last

#### Scenario: Rebuild partially fails
- **WHEN** one entry fails during sequential replay
- **THEN** the system SHALL record and skip that entry and continue replaying later entries
- **AND** it SHALL report attempted, succeeded, and skipped counts
- **AND** it SHALL provide a failure report containing the entry date, analysis identifier, failure category, and user-safe diagnostic message without journal text
- **AND** it SHALL allow the user to reset or retry

### Requirement: Reset the complete memory store
The system SHALL let a Test-view user reset all of their inferred memories and evidence after explicit confirmation.

#### Scenario: User confirms reset
- **WHEN** the user confirms the reset action
- **THEN** the system SHALL delete the current user's memories and evidence
- **AND** it SHALL NOT delete journal entries or saved analyses

#### Scenario: User cancels reset
- **WHEN** the user cancels the confirmation
- **THEN** the memory store SHALL remain unchanged

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
