## ADDED Requirements

### Requirement: Long history entries start compact
When a saved analysis has a long original journal entry, the history view SHALL present that entry collapsed by default with its date, word count, and a useful plain-text preview while keeping the analysis content accessible without scrolling past the full entry.

#### Scenario: Long entry is selected
- **WHEN** a user selects a saved analysis whose original entry exceeds the collapse threshold
- **THEN** the history view SHALL show the entry date, word count, and a preview without initially rendering the complete entry

#### Scenario: Collapsed preview is bounded
- **WHEN** a long original entry is collapsed
- **THEN** the preview SHALL be limited to a compact number of lines and characters and SHALL indicate when text was truncated

### Requirement: Full entry can be revealed accessibly
The history entry disclosure SHALL use a native keyboard-operable control with accurate expanded-state and controlled-panel relationships, and SHALL render the complete original entry as formatted Markdown when expanded.

#### Scenario: User reveals the full entry
- **WHEN** the user activates the show-full-entry control
- **THEN** the complete original journal entry SHALL appear with its supported Markdown formatting and the disclosure control SHALL remain available

#### Scenario: User hides the full entry with the keyboard
- **WHEN** the expanded disclosure control receives Enter or Space
- **THEN** the full entry SHALL collapse and the control label SHALL return to its collapsed-state wording

#### Scenario: Disclosure exposes its state
- **WHEN** the disclosure control is rendered
- **THEN** it SHALL expose `aria-expanded` matching the current state and `aria-controls` referencing the full-entry panel

### Requirement: Short history entries remain direct
An original journal entry at or below the collapse threshold SHALL render in full without a redundant disclosure control.

#### Scenario: Short entry is selected
- **WHEN** a user selects a saved analysis whose original entry is at or below the collapse threshold
- **THEN** the history view SHALL render the full formatted entry and SHALL NOT show a show-full-entry control

### Requirement: Disclosure state follows the selected analysis
The system SHALL preserve disclosure state while the same history item remains selected and SHALL reset a newly selected long entry to the collapsed state.

#### Scenario: Selection changes after expansion
- **WHEN** a user expands one history entry and then selects a different long history entry
- **THEN** the newly selected entry SHALL start collapsed

#### Scenario: Same selection remains active
- **WHEN** the selected history item does not change while other view state updates
- **THEN** its current expanded or collapsed disclosure state SHALL be preserved
