## ADDED Requirements

### Requirement: Auto-trigger analysis on paste of 300+ words

The system SHALL automatically trigger the analysis flow when a paste event results in the journal input containing 300 or more words.

#### Scenario: Paste brings total content to 300+ words
- **WHEN** user pastes text into the journal input
- **AND** the total word count of the editor content after the paste is 300 or more
- **THEN** the system SHALL automatically trigger analysis (equivalent to clicking the "Analyze" button)

#### Scenario: Paste results in fewer than 300 total words
- **WHEN** user pastes text into the journal input
- **AND** the total word count of the editor content after the paste is fewer than 300
- **THEN** the system SHALL NOT auto-trigger analysis
- **AND** the "Analyze" button remains available for manual use

#### Scenario: Typing crosses 300 words without paste
- **WHEN** user types text into the journal input (no paste event)
- **AND** the total word count exceeds 300
- **THEN** the system SHALL NOT auto-trigger analysis

#### Scenario: Analysis already in progress
- **WHEN** user pastes text while the editor is disabled (analysis in progress)
- **THEN** the system SHALL NOT trigger a second analysis

### Requirement: Scroll to top when analysis starts

The system SHALL scroll the page to the top when analysis is triggered, whether by auto-paste or manual button click.

#### Scenario: Auto-triggered analysis scrolls to top
- **WHEN** analysis is auto-triggered by a paste event
- **THEN** the page SHALL smoothly scroll to the top so the loading state is visible

#### Scenario: Manual analysis scrolls to top
- **WHEN** user clicks the "Analyze" button manually
- **THEN** the page SHALL smoothly scroll to the top

### Requirement: Manual analyze button remains functional

The "Analyze" button SHALL continue to work as before for all input methods and word counts.

#### Scenario: Manual analyze with fewer than 300 words
- **WHEN** user has typed or pasted fewer than 300 words
- **AND** user clicks the "Analyze" button
- **THEN** the system SHALL trigger analysis normally
