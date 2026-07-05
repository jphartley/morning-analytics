## MODIFIED Requirements

### Requirement: Live word count display
The JournalInput component SHALL display a word count below the editor in insight and test modes that updates in real time as the user types or pastes text. The component SHALL hide the visible word count in quiet mode while preserving word-count-dependent behavior.

#### Scenario: Word count updates on typing
- **WHEN** the user types text into the journal editor in `insight` or `test` mode
- **THEN** the word count display SHALL update to reflect the current number of words

#### Scenario: Word count updates on paste
- **WHEN** the user pastes text into the journal editor in `insight` or `test` mode
- **THEN** the word count display SHALL update to reflect the total word count including pasted content

#### Scenario: Empty editor shows zero
- **WHEN** the journal editor contains no text in `insight` or `test` mode
- **THEN** the word count display SHALL show "0 words"

#### Scenario: Single word shows singular form
- **WHEN** the journal editor contains exactly one word in `insight` or `test` mode
- **THEN** the word count display SHALL show "1 word"

#### Scenario: Quiet mode hides count
- **WHEN** the user is composing in `quiet` mode
- **THEN** the word count display SHALL NOT be visible

### Requirement: Auto-analyze threshold indicator
The word count display SHALL visually indicate when the 300-word auto-analyze threshold has been reached in insight and test modes. The visible threshold indicator SHALL be hidden in quiet mode, but auto-analyze behavior SHALL remain unchanged.

#### Scenario: Below threshold
- **WHEN** the word count is less than 300 and the user is in `insight` or `test` mode
- **THEN** the word count SHALL be displayed in muted styling

#### Scenario: At or above threshold
- **WHEN** the word count is 300 or greater and the user is in `insight` or `test` mode
- **THEN** the word count SHALL be displayed in accent color
- **AND** the text "(auto-analyze ready)" SHALL appear alongside the count

#### Scenario: Quiet mode preserves auto-analyze
- **WHEN** the user pastes text that meets the auto-analyze threshold in `quiet` mode
- **THEN** the system SHALL still trigger auto-analyze according to existing behavior
- **AND** the system SHALL NOT show the word count or "(auto-analyze ready)" text
