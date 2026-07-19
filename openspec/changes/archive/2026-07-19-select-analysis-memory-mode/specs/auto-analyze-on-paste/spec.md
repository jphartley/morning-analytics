## MODIFIED Requirements

### Requirement: Auto-trigger analysis on paste of 300+ words
The system SHALL automatically submit the journal entry through the effective analysis memory mode when a paste event results in the journal input containing 300 or more words.

#### Scenario: Paste triggers No memory mode
- **WHEN** a Test-view user selects No memory and pastes text that brings the editor content to 300 or more words
- **THEN** the system SHALL automatically produce one analysis without contextual-memory selection or injection

#### Scenario: Paste triggers Use memory mode
- **WHEN** a Test-view user selects Use memory and pastes text that brings the editor content to 300 or more words
- **THEN** the system SHALL automatically produce one memory-enabled analysis

#### Scenario: Paste triggers Blind comparison mode
- **WHEN** a Test-view user selects Blind comparison and pastes text that brings the editor content to 300 or more words
- **THEN** the system SHALL automatically produce the two-result blind comparison
- **AND** it SHALL NOT first produce or save a separate single analysis

#### Scenario: Paste triggers outside Test view
- **WHEN** a Quiet- or Insight-view user pastes text that brings the editor content to 300 or more words
- **THEN** the system SHALL automatically produce one memory-enabled analysis

#### Scenario: Paste results in fewer than 300 total words
- **WHEN** the user pastes text into the journal input
- **AND** the total word count of the editor content after the paste is fewer than 300
- **THEN** the system SHALL NOT auto-trigger analysis
- **AND** the Analyze button SHALL remain available for manual use

#### Scenario: Typing crosses 300 words without paste
- **WHEN** the user types text into the journal input without a paste event
- **AND** the total word count exceeds 300
- **THEN** the system SHALL NOT auto-trigger analysis

#### Scenario: Analysis is already in progress
- **WHEN** the user pastes text while the editor is disabled
- **THEN** the system SHALL NOT trigger a second analysis
