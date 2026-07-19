## ADDED Requirements

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

### Requirement: Compare new analyses blindly
The system SHALL let a Test-view user generate an ephemeral blind comparison for a new journal entry using the selected model and persona.

#### Scenario: Blind comparison is generated
- **WHEN** the user starts a comparison for a new entry
- **THEN** the system SHALL select relevant memory once
- **AND** it SHALL generate one text analysis with that memory and one without it
- **AND** it SHALL assign the results randomly to unlabeled A and B positions

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
- **THEN** the system SHALL NOT offer the blind-comparison action for that historical entry
